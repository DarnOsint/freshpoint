import type { User } from '@supabase/supabase-js'

export type LoginMethod = 'phone' | 'email' | 'username'
export type LoginSurface = 'customer' | 'admin'

export type LoginRequest = {
  surface: LoginSurface
  method: LoginMethod
  identifier: string
  password: string
}

export type LoginOutcome =
  | { ok: true; accessToken: string; refreshToken: string; user: User }
  | { ok: false; error: string; retryAfter?: number }

function retryMessage(retryAfter: number) {
  const seconds = Math.max(1, Math.ceil(retryAfter))
  return `Too many login attempts. Try again in ${seconds} second${seconds === 1 ? '' : 's'}.`
}

export async function submitLogin(input: LoginRequest, signal?: AbortSignal): Promise<LoginOutcome> {
  try {
    const response = await fetch('/api/customers?view=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal,
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const retryAfter = Number(payload.retryAfter)
      return {
        ok: false,
        error: retryAfter > 0 ? retryMessage(retryAfter) : typeof payload.error === 'string' ? payload.error : '',
        retryAfter: retryAfter > 0 ? retryAfter : undefined,
      }
    }

    const accessToken = String(payload.access_token ?? '')
    const refreshToken = String(payload.refresh_token ?? '')
    const user = payload.user as User | undefined
    if (!accessToken || !refreshToken || !user) return { ok: false, error: '' }
    return { ok: true, accessToken, refreshToken, user }
  } catch {
    return { ok: false, error: '' }
  }
}
