import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthMode = 'login' | 'signup'
export type AccountType = 'household' | 'retailer' | 'restaurant' | 'wholesale'

export type SignupDetails = {
  fullName: string
  username: string
  email: string
  accountType: AccountType
}

export type VerifyState = {
  phone: string
  mode: AuthMode
  details?: SignupDetails
}

export type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
