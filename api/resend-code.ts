import {
  InputError, assertConfigured, dbFetch, hashCode, newCode, codeExpiry,
  readJson, send, sendConfirmationEmail, type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type Confirmation = { full_name: string; attempts: number; created_at: string }

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  try {
    assertConfigured()
    const body = await readJson(req)
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError('Enter a valid email address.')

    const recordResponse = await dbFetch(`/rest/v1/email_confirmations?email=eq.${encodeURIComponent(email)}&select=full_name,attempts,created_at`)
    if (!recordResponse.ok) throw new Error('Confirmation lookup failed')
    const record = (await recordResponse.json() as Confirmation[])[0]
    if (!record) throw new InputError('Start signup again to receive a new code.')

    const age = Date.now() - new Date(record.created_at).getTime()
    if (age < 30_000) return send(res, 200, { ok: true, throttled: true })

    const code = newCode()
    const updateResponse = await dbFetch(`/rest/v1/email_confirmations?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        code_hash: hashCode(code),
        attempts: Math.min(record.attempts, 2),
        expires_at: codeExpiry(),
        created_at: new Date().toISOString(),
      }),
    })
    if (!updateResponse.ok) throw new Error('Could not refresh code')

    await sendConfirmationEmail(email, record.full_name, code)
    return send(res, 200, { ok: true })
  } catch (error) {
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Resend code failed:', error)
    return send(res, 500, { error: 'We could not resend the code. Please try again.' })
  }
}
