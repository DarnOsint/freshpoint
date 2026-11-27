import type { User } from '@supabase/supabase-js'
import type { Role } from './types'

function metadataRole(user: User | null | undefined): unknown {
  return user?.app_metadata?.role ?? user?.user_metadata?.role
}

export function roleForUser(user: User | null | undefined): Role {
  const role = metadataRole(user)
  return role === 'admin' || role === 'manager' ? role : 'customer'
}

export function isAdmin(user: User | null | undefined) {
  return roleForUser(user) === 'admin'
}

export function isManager(user: User | null | undefined) {
  return roleForUser(user) === 'manager'
}

export function isStaff(user: User | null | undefined) {
  const role = roleForUser(user)
  return role === 'admin' || role === 'manager'
}

export function homePathForUser(user: User | null | undefined) {
  const role = roleForUser(user)
  if (role === 'admin') return '/admin'
  if (role === 'manager') return '/manager'
  return '/app/shop'
}
