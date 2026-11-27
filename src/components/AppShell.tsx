import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useData } from '../lib/data-store'
import { useSiteSettings } from '../lib/site-content'
import { Logo } from './Logo'
import { NotificationSheet } from './NotificationSheet'
import { TabIcon } from './TabIcon'

export function AppShell() {
  const { signOut } = useAuth()
  const { cartCount, orders, unreadNotificationCount } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.shell
  const navigate = useNavigate()
  const location = useLocation()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const pendingCount = orders.filter((order) => order.status !== 'Delivered' && order.status !== 'Cancelled').length

  const navItems = [
    { to: '/app', label: copy.home, key: 'home' },
    { to: '/app/cart', label: copy.basket, key: 'cart' },
    { to: '/app/orders', label: copy.orders, key: 'orders' },
    { to: '/app/account', label: copy.profile, key: 'profile' },
  ]

  function isActive(key: string, to: string) {
    if (key === 'home') return location.pathname === '/app' || location.pathname === '/app/shop'
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand"><Logo light label={settings.brand.appName} /></div>
        <nav className="app-sidebar__nav" aria-label={copy.navigation}>
          {navItems.map(({ to, label, key }) => (
            <NavLink key={to} to={to} className={`app-nav-link${isActive(key, to) ? ' app-nav-link--active' : ''}`}>
              <TabIcon name={key as 'home' | 'cart' | 'orders' | 'profile'} />
              <span>{label}</span>
              {key === 'cart' && cartCount > 0 ? <em>{cartCount}</em> : null}
              {key === 'orders' && pendingCount > 0 ? <em>{pendingCount}</em> : null}
            </NavLink>
          ))}
        </nav>
        <button className="app-sidebar__signout" type="button" onClick={() => void handleSignOut()}>
          {copy.signOut}
        </button>
      </aside>

      <div className="app-body">
        <header className="app-topbar">
          <div className="app-topbar__brand"><Logo label={settings.brand.appName} /></div>
          <div className="app-topbar__actions">
            <NavLink to="/app/cart" className="app-topbar__icon" aria-label={copy.basketAria.replace('{count}', String(cartCount))}>
              <TabIcon name="cart" />
              {cartCount > 0 ? <span className="app-topbar__badge">{cartCount}</span> : null}
            </NavLink>
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
          </div>
        </header>

        <main className="app-main"><Outlet /></main>

        <nav className="app-tabbar" aria-label={copy.navigation}>
          {navItems.map(({ to, label, key }) => (
            <NavLink key={to} to={to} className={`app-tab${isActive(key, to) ? ' app-tab--active' : ''}`}>
              <TabIcon name={key as 'home' | 'cart' | 'orders' | 'profile'} />
              <span>
                {label}
                {key === 'cart' && cartCount > 0 ? <em>{cartCount}</em> : null}
                {key === 'orders' && pendingCount > 0 ? <em>{pendingCount}</em> : null}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {notificationsOpen ? <NotificationSheet onClose={() => setNotificationsOpen(false)} /> : null}
    </div>
  )
}
