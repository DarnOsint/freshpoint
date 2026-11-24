import {
  InputError, adminFetch, assertConfigured, dbFetch, hashCode, publicFetch,
  readJson, send, sendWelcomeEmail, type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type Confirmation = {
  user_id: string
  code_hash: string
  full_name: string
  username: string
  phone: string | null
  account_type: string
  attempts: number
  expires_at: string
}

const INVALID = 'That code isn’t valid or has expired. Request a new one.'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  try {
    assertConfigured()
    const body = await readJson(req)
    const email = String(body.email ?? '').trim().toLowerCase()
    const code = String(body.code ?? '').replace(/\D/g, '')
    const password = String(body.password ?? '')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || code.length !== 6 || !password) {
      throw new InputError(INVALID)
    }

    const recordResponse = await dbFetch(`/rest/v1/email_confirmations?email=eq.${encodeURIComponent(email)}&select=*`)
    if (!recordResponse.ok) throw new Error('Confirmation lookup failed')
    const records = await recordResponse.json() as Confirmation[]
    const record = records[0]

    if (!record || record.attempts >= 5 || new Date(record.expires_at).getTime() < Date.now()) {
      throw new InputError(INVALID)
    }

    if (hashCode(code) !== record.code_hash) {
      await dbFetch(`/rest/v1/email_confirmations?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ attempts: record.attempts + 1 }),
      })
      throw new InputError(INVALID)
    }

    const confirmResponse = await adminFetch(`/auth/v1/admin/users/${record.user_id}`, {
      method: 'PUT',
      body: JSON.stringify({ email_confirm: true }),
    })
    if (!confirmResponse.ok) throw new Error('Could not confirm email')

    const profileResponse = await dbFetch('/rest/v1/profiles?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: record.user_id,
        full_name: record.full_name,
        username: record.username,
        phone: record.phone,
        email,
        account_type: record.account_type,
        role: 'customer',
        updated_at: new Date().toISOString(),
      }),
    })
    if (!profileResponse.ok) throw new Error('Could not save profile')

    const tokenResponse = await publicFetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (!tokenResponse.ok) throw new Error('Could not start session')
    const session = await tokenResponse.json() as {
      access_token: string
      refresh_token: string
      expires_in: number
      token_type: string
      user: unknown
    }

    try {
      await sendWelcomeEmail(email, record.full_name)
    } catch (emailError) {
      console.error('Welcome email failed:', emailError)
    }

    await dbFetch(`/rest/v1/email_confirmations?email=eq.${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    })

    return send(res, 200, {
      ok: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    })
  } catch (error) {
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Email verification failed:', error)
    return send(res, 500, { error: 'We could not verify your code. Please try again.' })
  }
}
