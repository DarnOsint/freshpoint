import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { isAdmin } from '../lib/roles'

function Loading() {
  return (
    <div className="app-loading">
      <span className="app-loading__spinner" aria-hidden="true" />
      <p>Loading FreshPoint…</p>
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!isAdmin(user)) return <Navigate to="/app" replace />
  return <>{children}</>
}
