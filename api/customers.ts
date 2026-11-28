import {
  AuthError, ForbiddenError, InputError, adminFetch, assertConfigured, clearLoginAttempts,
  consumeLoginAttempt, dbFetch, listAuditLogs, loginIdentityKey, loginIpKey, publicFetch,
  readJson, recordAudit, requireAdmin, requireStaff, requireUser, roleFromUser,
  signInWithPassword, vapidPublicKeyForClient, send, type ApiRequest, type ApiResponse,
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

const ACCOUNT_ATTEMPT_LIMIT = 8
const IP_ATTEMPT_LIMIT = 200
const ATTEMPT_WINDOW_SECONDS = 15 * 60
const ATTEMPT_BLOCK_SECONDS = 15 * 60

type LoginRoute = {
  identifier: string
  usePhone: boolean
  normalized: string
}

const CLIENT_EVENTS = new Set([
  'session.open',
  'session.login',
  'catalogue.search',
  'catalogue.filter',
  'catalogue.add',
  'catalogue.increase',
  'catalogue.decrease',
  'cart.open',
  'checkout.start',
  'order.view',
  'notification.open',
  'notification.read',
  'notification.read_all',
  'notification.enable',
  'notification.prompt_dismiss',
  'profile.update',
  'support.contact',
])

function cleanEventDetails(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .filter(([key, value]) => key.length <= 32 && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'))
      .slice(0, 10)
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 120) : value]),
  )
}

function normalizeLoginInput(method: string, raw: string) {
  if (method === 'email') {
    const value = raw.trim().toLowerCase()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : ''
  }
  if (method === 'phone') {
    const digits = raw.replace(/\D/g, '')
    return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : ''
  }
  if (method === 'username') {
    const value = raw.trim().toLowerCase()
    return /^[a-z0-9_]{3,20}$/.test(value) ? value : ''
  }
  return ''
}

async function resolveLoginRoute(method: string, normalized: string): Promise<LoginRoute | null> {
  if (method === 'email') return { identifier: normalized, usePhone: false, normalized }
  if (method === 'phone') {
    const response = await publicFetch('/rpc/login_identifier_for_phone', {
      method: 'POST',
      body: JSON.stringify({ p_phone: normalized }),
    })
    if (!response.ok) return null
    const rows = await response.json() as Array<{ email?: string }>
    const email = rows[0]?.email
    return email ? { identifier: email, usePhone: false, normalized } : null
  }

  const response = await publicFetch('/rpc/login_identifier_for_username', {
    method: 'POST',
    body: JSON.stringify({ p_username: normalized }),
  })
  if (!response.ok) return null
  const rows = await response.json() as Array<{ identifier?: string; kind?: string }>
  const identifier = rows[0]?.identifier
  if (!identifier) return null
  const usePhone = rows[0]?.kind === 'phone'
  return {
    identifier: usePhone ? `+${identifier.replace(/\D/g, '')}` : identifier,
    usePhone,
    normalized,
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const requestUrl = new URL(req.url ?? '', 'http://localhost')
    const isPushView = requestUrl.searchParams.get('view') === 'push'
    const isEventsView = requestUrl.searchParams.get('view') === 'events'
    const isLoginView = requestUrl.searchParams.get('view') === 'login'

    if (isLoginView && req.method === 'POST') {
      assertConfigured()
      const body = await readJson(req)
      const surface = body.surface === 'admin' ? 'admin' : 'customer'
      const method = String(body.method ?? '').trim().toLowerCase()
      const rawIdentifier = String(body.identifier ?? '').trim()
      const password = String(body.password ?? '')
      if (!['email', 'phone', 'username'].includes(method)) throw new InputError('Choose a valid sign-in method.')
      if (surface === 'admin' && method === 'phone') throw new InputError('Phone sign-in is not available here.')
      if (!rawIdentifier || rawIdentifier.length > 200 || !password || password.length > 200) {
        throw new InputError('Enter your sign-in details.')
      }
      const normalized = normalizeLoginInput(method, rawIdentifier)
      if (!normalized) throw new InputError('Enter valid sign-in details.')

      const identityKey = loginIdentityKey(surface, normalized)
      const rateChecks = await Promise.all([
        consumeLoginAttempt(identityKey, ACCOUNT_ATTEMPT_LIMIT, ATTEMPT_WINDOW_SECONDS, ATTEMPT_BLOCK_SECONDS),
        consumeLoginAttempt(loginIpKey(req), IP_ATTEMPT_LIMIT, ATTEMPT_WINDOW_SECONDS, ATTEMPT_BLOCK_SECONDS),
      ])
      const limited = rateChecks.find((check) => !check.allowed)
      if (limited) {
        return send(res, 429, {
          error: 'Too many login attempts. Please try again shortly.',
          retryAfter: limited.retryAfter,
        })
      }

      const route = await resolveLoginRoute(method, normalized)
      const session = route ? await signInWithPassword(route.identifier, password, route.usePhone) : null
      if (!session) return send(res, 401, { error: 'The details you entered are incorrect.' })
      if (surface === 'admin' && roleFromUser(session.user) !== 'admin') {
        return send(res, 403, { error: 'This account cannot access the admin area.' })
      }

      await clearLoginAttempts([identityKey])
      return send(res, 200, {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      })
    }

    if (isEventsView && req.method === 'POST') {
      const user = await requireUser(req)
      const body = await readJson(req)
      const action = String(body.action ?? '').trim()
      const targetType = String(body.targetType ?? 'activity').trim().slice(0, 40) || 'activity'
      const targetId = String(body.targetId ?? '').trim().slice(0, 200)
      if (!CLIENT_EVENTS.has(action)) throw new InputError('That activity event is not supported.')
      await recordAudit(user, action, targetType, targetId, cleanEventDetails(body.details))
      return send(res, 200, { ok: true })
    }

    if (isPushView && (req.method === 'POST' || req.method === 'DELETE')) {
      const user = await requireUser(req)
      const body = req.method === 'POST' ? await readJson(req) : {}
      const endpoint = String(body.endpoint ?? '').trim()
      const keys = body.keys as { p256dh?: unknown; auth?: unknown } | undefined
      const p256dh = String(keys?.p256dh ?? '').trim()
      const auth = String(keys?.auth ?? '').trim()
      if (req.method === 'POST' && (!endpoint.startsWith('https://') || !p256dh || !auth)) {
        throw new InputError('That notification subscription is not valid.')
      }

      const lookup = await adminFetch(`/auth/v1/admin/users/${encodeURIComponent(user.id)}`)
      if (!lookup.ok) throw new Error('Account lookup failed')
      const target = await lookup.json() as AuthUserRow
      const stored = Array.isArray(target.user_metadata?.pushSubscriptions)
        ? target.user_metadata.pushSubscriptions as Array<Record<string, unknown>>
        : []

      let next: Array<Record<string, unknown>>
      if (req.method === 'DELETE') {
        next = stored.filter((entry) => String(entry.endpoint ?? '') !== endpoint)
      } else {
        next = [
          ...stored.filter((entry) => String(entry.endpoint ?? '') !== endpoint),
          { endpoint, keys: { p256dh, auth }, createdAt: new Date().toISOString() },
        ]
      }

      const metadata = await adminFetch(`/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'PUT',
        body: JSON.stringify({ user_metadata: { ...target.user_metadata, pushSubscriptions: next } }),
      })
      if (!metadata.ok) throw new Error('Could not save the notification subscription')
      return send(res, 200, { ok: true, count: next.length })
    }

    if (req.method === 'PATCH') {
      const actor = await requireUser(req)
      const body = await readJson(req)
      const userId = String(body.userId ?? '').trim()
      const targetId = userId || actor.id
      const fullName = String(body.fullName ?? '').trim()
      const username = String(body.username ?? '').trim().toLowerCase()
      const email = String(body.email ?? '').trim().toLowerCase()
      const rawPhone = String(body.phone ?? '').trim()
      const phoneDigits = rawPhone.replace(/\D/g, '')
      const phone = phoneDigits ? `+${phoneDigits}` : ''
      const address = String(body.address ?? '').trim()

      if (fullName.length < 2 || fullName.length > 80) throw new InputError('Enter a name between 2 and 80 characters.')
      if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new InputError('Use 3–20 letters, numbers or underscores for your username.')
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError('Enter a valid email address.')
      if (phone && !/^\+[1-9]\d{6,14}$/.test(phone)) throw new InputError('Enter a valid phone number.')
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
    if (url.searchParams.get('view') === 'push') {
      const user = await requireUser(req)
      const stored = user.user_metadata?.pushSubscriptions
      return send(res, 200, {
        publicKey: vapidPublicKeyForClient(),
        subscriptions: Array.isArray(stored) ? stored : [],
      })
    }

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

    if (url.searchParams.get('view') === 'events') {
      await requireAdmin(req)
      return send(res, 200, await listAuditLogs(1000))
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
