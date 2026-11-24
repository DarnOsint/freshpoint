import {
  InputError, assertConfigured, codeExpiry, dbFetch, hashCode, newCode,
  readJson, send, sendPasswordResetEmail, type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type Profile = { id: string; full_name: string | null }
type Reset = { created_at: string }

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  try {
    assertConfigured()
    const body = await readJson(req)
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError('Enter a valid email address.')

    const profileResponse = await dbFetch(
      `/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,full_name&limit=1`,
    )
    if (!profileResponse.ok) {
      console.error('Profile lookup failed:', profileResponse.status, await profileResponse.text())
      throw new Error('Account lookup failed')
    }
    const profile = (await profileResponse.json() as Profile[])[0]

    // Never reveal whether an address is registered.
    if (!profile) return send(res, 200, { ok: true })

    const existingResponse = await dbFetch(
      `/rest/v1/password_resets?email=eq.${encodeURIComponent(email)}&select=created_at`,
    )
    if (!existingResponse.ok) throw new Error('Reset lookup failed')
    const existing = (await existingResponse.json() as Reset[])[0]
    if (existing && Date.now() - new Date(existing.created_at).getTime() < 30_000) {
      return send(res, 200, { ok: true, throttled: true })
    }

    const code = newCode()
    const saved = await dbFetch('/rest/v1/password_resets?on_conflict=email', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        email,
        user_id: profile.id,
        code_hash: hashCode(code),
        full_name: profile.full_name || 'there',
        attempts: 0,
        expires_at: codeExpiry(),
        created_at: new Date().toISOString(),
      }),
    })
    if (!saved.ok) throw new Error('Could not store reset code')

    try {
      await sendPasswordResetEmail(email, profile.full_name || 'there', code)
    } catch (emailError) {
      console.error('Password reset email failed:', emailError)
      await dbFetch(`/rest/v1/password_resets?email=eq.${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      }).catch(() => undefined)
      throw new InputError('We couldn’t send the reset email. Check the address and try again.')
    }

    return send(res, 200, { ok: true })
  } catch (error) {
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Forgot password failed:', error)
    return send(res, 500, { error: 'We could not start a password reset. Please try again.' })
  }
}
