import type { User } from '@supabase/supabase-js'

export function isAdmin(user: User | null | undefined) {
  if (!user) return false
  return user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin'
}
