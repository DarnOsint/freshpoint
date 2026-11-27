import {
  AuthError, ForbiddenError, InputError, adminFetch, dbFetch, readJson,
  requireAdmin, send, type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type AuthUser = {
  id: string
  app_metadata?: Record<string, unknown>
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  try {
    const admin = await requireAdmin(req)
    const body = await readJson(req)
    const userId = String(body.userId ?? '').trim()
    const role = String(body.role ?? '').trim()
    if (!userId) throw new InputError('Choose an account to update.')
    if (role !== 'manager' && role !== 'customer') throw new InputError('Choose a valid role.')
    if (userId === admin.id) throw new ForbiddenError('You cannot change your own role.')

    const lookup = await adminFetch(`/auth/v1/admin/users/${encodeURIComponent(userId)}`)
    if (lookup.status === 404) throw new InputError('That account could not be found.')
    if (!lookup.ok) throw new Error('Account lookup failed')
    const target = await lookup.json() as AuthUser

    const update = await adminFetch(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        app_metadata: { ...target.app_metadata, role },
      }),
    })
    if (!update.ok) throw new Error('Could not update the account role')

    const profile = await dbFetch(`/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ role, updated_at: new Date().toISOString() }),
    })
    if (!profile.ok && profile.status !== 400) {
      console.error('Profile role mirror failed:', profile.status, await profile.text())
    }

    return send(res, 200, { ok: true, userId, role })
  } catch (error) {
    if (error instanceof AuthError || error instanceof ForbiddenError) {
      return send(res, error instanceof AuthError ? 401 : 403, { error: error.message })
    }
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Role API failed:', error)
    return send(res, 500, { error: 'We could not update this role. Please try again.' })
  }
}
