import {
  AuthError, ForbiddenError, InputError, adminFetch, dbFetch, listAuditLogs, readJson,
  recordAudit, requireAdmin, requireStaff, requireUser, roleFromUser,
  send, type ApiRequest, type ApiResponse,
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
  user_metadata?: Record<string, unknown>
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === 'PATCH') {
      const actor = await requireUser(req)
      const body = await readJson(req)
      const userId = String(body.userId ?? '').trim()
      const targetId = userId || actor.id
      const fullName = String(body.fullName ?? '').trim()
      const username = String(body.username ?? '').trim().toLowerCase()
      const email = String(body.email ?? '').trim().toLowerCase()
      const rawPhone = String(body.phone ?? '').trim()
      const phone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+${rawPhone.replace(/\D/g, '')}`) : ''
      const address = String(body.address ?? '').trim()

      if (fullName.length < 2 || fullName.length > 80) throw new InputError('Enter a name between 2 and 80 characters.')
      if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new InputError('Use 3–20 letters, numbers or underscores for your username.')
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError('Enter a valid email address.')
      if (phone && !/^\+\d{7,15}$/.test(phone)) throw new InputError('Enter a valid phone number.')
      if (address.length > 200) throw new InputError('Enter a shorter delivery address.')

      const taken = await dbFetch(`/profiles?username=eq.${encodeURIComponent(username)}&id=neq.${encodeURIComponent(targetId)}&select=id&limit=1`)
      if (!taken.ok) throw new Error('Username lookup failed')
      if ((await taken.json() as unknown[]).length > 0) throw new InputError('That username is taken. Choose another.')

      if (phone) {
        const phoneTaken = await dbFetch(`/profiles?phone=eq.${encodeURIComponent(phone)}&id=neq.${encodeURIComponent(targetId)}&select=id&limit=1`)
        if (!phoneTaken.ok) throw new Error('Phone lookup failed')
        if ((await phoneTaken.json() as unknown[]).length > 0) throw new InputError('That phone number is already in use.')
      }

      const lookup = await adminFetch(`/auth/v1/admin/users/${encodeURIComponent(targetId)}`)
      if (!lookup.ok) throw new Error('Account lookup failed')
      const target = await lookup.json() as AuthUserRow

      let nextRole: string | undefined
      if (userId) {
        if (roleFromUser(actor) !== 'admin') throw new ForbiddenError('Admin access required.')
        if (body.role === 'manager' || body.role === 'customer') nextRole = body.role
        if (targetId === actor.id || target.app_metadata?.role === 'admin') nextRole = undefined
      }

      const userMetadata: Record<string, unknown> = { ...target.user_metadata, full_name: fullName, username }
      if (email) userMetadata.email = email
      if (phone) userMetadata.phone = phone
      if (address) userMetadata.address = address
      else delete userMetadata.address

      const authUpdate: Record<string, unknown> = { user_metadata: userMetadata }
      if (email) {
        authUpdate.email = email
        authUpdate.email_confirm = true
      }
      if (phone) authUpdate.phone = phone
      if (nextRole) authUpdate.app_metadata = { ...target.app_metadata, role: nextRole }

      const metadata = await adminFetch(`/auth/v1/admin/users/${encodeURIComponent(targetId)}`, {
        method: 'PUT',
        body: JSON.stringify(authUpdate),
      })
      if (!metadata.ok) {
        const detail = await metadata.text()
        if (metadata.status === 409 || metadata.status === 422) throw new InputError('That email or phone number is already in use.')
        console.error('Account update failed:', metadata.status, detail)
        throw new Error('Could not update account details')
      }

      const profileUpdate: Record<string, unknown> = { full_name: fullName, username, updated_at: new Date().toISOString() }
      if (email) profileUpdate.email = email
      if (phone) profileUpdate.phone = phone
      if (nextRole) profileUpdate.role = nextRole

      const profile = await dbFetch(`/profiles?id=eq.${encodeURIComponent(targetId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(profileUpdate),
      })
      if (!profile.ok) throw new Error('Could not update profile')

      if (userId && roleFromUser(actor) !== 'customer') {
        await recordAudit(actor, 'customer.update', 'customer', targetId, {
          name: fullName,
          username,
          email,
          phone,
          address,
        })
        if (nextRole) {
          await recordAudit(actor, 'customer.role_change', 'customer', targetId, {
            from: target.app_metadata?.role ?? 'customer',
            to: nextRole,
          })
        }
      }

      return send(res, 200, { ok: true, fullName, username, email, phone, address, role: nextRole ?? target.app_metadata?.role ?? 'customer' })
    }

    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' })

    const url = new URL(req.url ?? '', 'http://localhost')
    if (url.searchParams.get('view') === 'me') {
      const user = await requireUser(req)
      const response = await dbFetch(`/profiles?id=eq.${encodeURIComponent(user.id)}&select=full_name,username,phone,email`)
      if (!response.ok) throw new Error('Profile lookup failed')
      const rows = await response.json() as Array<{ full_name: string | null; username: string | null; phone: string | null; email: string | null }>
      const profile = rows[0] ?? { full_name: null, username: null, phone: null, email: null }
      return send(res, 200, {
        fullName: profile.full_name ?? '',
        username: profile.username ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        address: String(user.user_metadata?.address ?? ''),
      })
    }

    if (url.searchParams.get('view') === 'audit') {
      await requireAdmin(req)
      return send(res, 200, await listAuditLogs())
    }

    await requireStaff(req)
    const response = await dbFetch('/profiles?select=id,full_name,username,phone,email,role,created_at&order=created_at.desc')
    if (!response.ok) throw new Error('Customer lookup failed')
    const profiles = await response.json() as ProfileRow[]

    const usersResponse = await adminFetch('/auth/v1/admin/users?per_page=500')
    if (!usersResponse.ok) throw new Error('Account lookup failed')
    const usersPayload = await usersResponse.json() as { users?: AuthUserRow[] }
    const roles = new Map((usersPayload.users ?? []).map((user) => [user.id, user.app_metadata?.role]))
    const addresses = new Map((usersPayload.users ?? []).map((user) => [user.id, String(user.user_metadata?.address ?? '')]))

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
        address: addresses.get(profile.id) ?? '',
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
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Customers API failed:', error)
    return send(res, 500, { error: 'Customers are temporarily unavailable. Please try again.' })
  }
}
