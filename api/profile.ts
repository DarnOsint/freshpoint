import {
  AuthError, ForbiddenError, InputError, adminFetch, dbFetch, readJson,
  requireUser, send, type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type AuthUser = {
  id: string
  user_metadata?: Record<string, unknown>
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  try {
    const user = await requireUser(req)
    const body = await readJson(req)
    const fullName = String(body.fullName ?? '').trim()
    const username = String(body.username ?? '').trim().toLowerCase()

    if (fullName.length < 2 || fullName.length > 80) throw new InputError('Enter a name between 2 and 80 characters.')
    if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new InputError('Use 3–20 letters, numbers or underscores for your username.')

    const taken = await dbFetch(`/profiles?username=eq.${encodeURIComponent(username)}&id=neq.${encodeURIComponent(user.id)}&select=id&limit=1`)
    if (!taken.ok) throw new Error('Username lookup failed')
    if ((await taken.json() as unknown[]).length > 0) throw new InputError('That username is taken. Choose another.')

    const lookup = await adminFetch(`/auth/v1/admin/users/${encodeURIComponent(user.id)}`)
    if (!lookup.ok) throw new Error('Account lookup failed')
    const target = await lookup.json() as AuthUser

    const metadata = await adminFetch(`/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        user_metadata: { ...target.user_metadata, full_name: fullName, username },
      }),
    })
    if (!metadata.ok) throw new Error('Could not update account details')

    const profile = await dbFetch(`/profiles?id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ full_name: fullName, username, updated_at: new Date().toISOString() }),
    })
    if (!profile.ok) throw new Error('Could not update profile')

    return send(res, 200, { ok: true, fullName, username })
  } catch (error) {
    if (error instanceof AuthError || error instanceof ForbiddenError) {
      return send(res, error instanceof AuthError ? 401 : 403, { error: error.message })
    }
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Profile API failed:', error)
    return send(res, 500, { error: 'We could not save your details. Please try again.' })
  }
}
