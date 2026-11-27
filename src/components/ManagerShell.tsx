import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useData } from '../lib/data-store'
import { useSiteSettings } from '../lib/site-content'
import { Logo } from './Logo'
import { NotificationSheet } from './NotificationSheet'
import { PushOptInPrompt } from './PushOptInPrompt'

const navItems = [
  { to: '/manager', label: 'Overview', end: true },
  { to: '/manager/orders', label: 'Orders', end: false },
  { to: '/manager/customers', label: 'Customers', end: false },
]

export function ManagerShell() {
  const { signOut } = useAuth()
  const { orders, unreadNotificationCount } = useData()
  const { settings } = useSiteSettings()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const pending = orders.filter((order) => order.status !== 'Delivered' && order.status !== 'Cancelled').length
  const copy = settings.interface.app.shell

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Logo light label={settings.brand.appName} />
          <p>Manager console</p>
        </div>
        <nav className="admin-sidebar__nav" aria-label="Manager navigation">
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`}>
              <span>{label}</span>
              {to === '/manager/orders' && pending > 0 ? <em>{pending}</em> : null}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <a href="/" className="admin-nav-link"><span>View website</span></a>
          <button type="button" onClick={() => void handleSignOut()}>Sign out</button>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <div className="admin-topbar__brand"><Logo label={settings.brand.appName} /></div>
          <span className="admin-topbar__label">Manager console</span>
          <button
            type="button"
            className="app-topbar__icon"
            aria-label={copy.notificationsAria.replace('{count}', String(unreadNotificationCount))}
            onClick={() => setNotificationsOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unreadNotificationCount > 0 ? <span className="app-topbar__badge">{unreadNotificationCount}</span> : null}
          </button>
          <button type="button" className="admin-topbar__signout" onClick={() => void handleSignOut()} aria-label="Sign out">
            Sign out
          </button>
        </header>

        <main className="admin-main"><Outlet /></main>

        <nav className="admin-tabbar admin-tabbar--manager" aria-label="Manager navigation">
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-tab${isActive ? ' app-tab--active' : ''}`}>
              <span>
                {label}
                {to === '/manager/orders' && pending > 0 ? <em>{pending}</em> : null}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {notificationsOpen ? <NotificationSheet onClose={() => setNotificationsOpen(false)} ordersPath="/manager/orders" /> : <PushOptInPrompt />}
    </div>
  )
}
