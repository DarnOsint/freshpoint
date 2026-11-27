import {
  InputError, adminFetch, assertConfigured, dbFetch, hashCode, newCode, codeExpiry,
  publicFetch, readJson, send, sendConfirmationEmail,
  type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  try {
    assertConfigured()
    const body = await readJson(req)
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const fullName = String(body.fullName ?? '').trim()
    const username = String(body.username ?? '').trim().toLowerCase()
    const rawPhone = String(body.phone ?? '').trim()
    const phone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+${rawPhone.replace(/\D/g, '')}`) : null

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError('Enter a valid email address.')
    if (password.length < 8) throw new InputError('Use a password of at least 8 characters.')
    if (fullName.length < 2) throw new InputError('Enter your full name.')
    if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new InputError('Use 3–20 letters, numbers or underscores for your username.')
    if (phone && !/^\+\d{7,15}$/.test(phone)) throw new InputError('Enter a valid phone number.')

    const takenResponse = await publicFetch('/rest/v1/rpc/username_exists', {
      method: 'POST',
      body: JSON.stringify({ p_username: username }),
    })
    if (!takenResponse.ok) throw new Error('Username lookup failed')
    if ((await takenResponse.json()) === true) throw new InputError('That username is taken. Choose another.')

    if (phone) {
      const phoneResponse = await dbFetch(`/profiles?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`)
      if (!phoneResponse.ok) throw new Error('Phone lookup failed')
      if ((await phoneResponse.json() as unknown[]).length > 0) {
        throw new InputError('That phone number is already registered.')
      }
    }

    const createResponse = await adminFetch('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: false,
        app_metadata: { role: 'customer' },
        user_metadata: {
          full_name: fullName,
          username,
          email,
          phone,
        },
      }),
    })
    if (!createResponse.ok) {
      if (createResponse.status === 422 || createResponse.status === 409) {
        throw new InputError('An account with this email already exists. Log in instead.')
      }
      console.error('Supabase user creation failed:', createResponse.status, await createResponse.text())
      throw new Error('Could not create account')
    }
    const user = await createResponse.json() as { id?: string }
    if (!user.id) throw new Error('Supabase user creation returned no id')

    const code = newCode()
    const confirmation = {
      email,
      user_id: user.id,
      code_hash: hashCode(code),
      full_name: fullName,
      username,
      phone,
      attempts: 0,
      expires_at: codeExpiry(),
    }
    const confirmationOptions = {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    }
    let confirmationResponse = await dbFetch('/email_confirmations?on_conflict=email', {
      ...confirmationOptions,
      body: JSON.stringify(confirmation),
    })
    if (!confirmationResponse.ok) {
      // Older databases still require the legacy account_type column.
      confirmationResponse = await dbFetch('/email_confirmations?on_conflict=email', {
        ...confirmationOptions,
        body: JSON.stringify({ ...confirmation, account_type: 'household' }),
      })
    }
    if (!confirmationResponse.ok) {
      console.error('Confirmation storage failed:', confirmationResponse.status, await confirmationResponse.text())
      throw new Error('Could not store confirmation')
    }

    try {
      await sendConfirmationEmail(email, fullName, code)
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError)
      await adminFetch(`/auth/v1/admin/users/${user.id}`, { method: 'DELETE' }).catch(() => undefined)
      await dbFetch(`/email_confirmations?email=eq.${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      }).catch(() => undefined)
      throw new InputError('We couldn’t send the confirmation email. Check the address and try again.')
    }

    return send(res, 200, { ok: true, email })
  } catch (error) {
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Signup failed:', error)
    return send(res, 500, { error: 'We could not create your account. Please try again.' })
  }
}
