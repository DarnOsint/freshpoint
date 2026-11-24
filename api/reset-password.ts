import {
  InputError, adminFetch, assertConfigured, dbFetch, hashCode,
  readJson, send, sendPasswordChangedEmail, type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type Reset = {
  user_id: string
  code_hash: string
  full_name: string
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || code.length !== 6) {
      throw new InputError(INVALID)
    }
    if (password.length < 8) throw new InputError('Use a password of at least 8 characters.')

    const recordResponse = await dbFetch(
      `/password_resets?email=eq.${encodeURIComponent(email)}&select=*`,
    )
    if (!recordResponse.ok) throw new Error('Reset lookup failed')
    const record = (await recordResponse.json() as Reset[])[0]

    if (!record || record.attempts >= 5 || new Date(record.expires_at).getTime() < Date.now()) {
      throw new InputError(INVALID)
    }

    if (hashCode(code) !== record.code_hash) {
      await dbFetch(`/password_resets?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ attempts: record.attempts + 1 }),
      })
      throw new InputError(INVALID)
    }

    const updateResponse = await adminFetch(`/auth/v1/admin/users/${record.user_id}`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    })
    if (!updateResponse.ok) {
      console.error('Password update failed:', updateResponse.status, await updateResponse.text())
      throw new Error('Could not update password')
    }

    try {
      await sendPasswordChangedEmail(email, record.full_name)
    } catch (emailError) {
      console.error('Password changed email failed:', emailError)
    }

    await dbFetch(`/password_resets?email=eq.${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    })

    return send(res, 200, { ok: true })
  } catch (error) {
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Password reset failed:', error)
    return send(res, 500, { error: 'We could not reset your password. Please try again.' })
  }
}
