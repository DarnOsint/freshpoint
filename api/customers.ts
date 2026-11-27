import {
  AuthError, ForbiddenError, adminFetch, dbFetch, requireStaff, send,
  type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type ProfileRow = {
  id: string
  full_name: string | null
  username: string | null
  phone: string | null
  email: string | null
  role: string | null
  created_at: string
}

type AuthUserRow = {
  id: string
  app_metadata?: { role?: string }
  user_metadata?: { role?: string }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' })

  try {
    await requireStaff(req)
    const response = await dbFetch('/profiles?select=id,full_name,username,phone,email,role,created_at&order=created_at.desc')
    if (!response.ok) throw new Error('Customer lookup failed')
    const profiles = await response.json() as ProfileRow[]

    const usersResponse = await adminFetch('/auth/v1/admin/users?per_page=500')
    if (!usersResponse.ok) throw new Error('Account lookup failed')
    const usersPayload = await usersResponse.json() as { users?: AuthUserRow[] }
    const roles = new Map((usersPayload.users ?? []).map((user) => [
      user.id,
      user.app_metadata?.role ?? user.user_metadata?.role,
    ]))

    const customers = profiles.map((profile) => {
      const metadataRole = roles.get(profile.id)
      const role = metadataRole === 'admin' || metadataRole === 'manager'
        ? metadataRole
        : profile.role === 'admin' ? 'admin' : 'customer'
      return {
        id: profile.id,
        name: profile.full_name?.trim() || profile.email?.split('@')[0] || 'FreshPoint customer',
        username: profile.username?.trim() || profile.email?.split('@')[0] || 'customer',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        joinedAt: profile.created_at,
        role,
      }
    })

    return send(res, 200, customers)
  } catch (error) {
    if (error instanceof AuthError || error instanceof ForbiddenError) {
      return send(res, error instanceof AuthError ? 401 : 403, { error: error.message })
    }
    console.error('Customers API failed:', error)
    return send(res, 500, { error: 'Customers are temporarily unavailable. Please try again.' })
  }
}
