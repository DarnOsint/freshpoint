import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useData } from '../lib/data-store'
import { useSiteSettings } from '../lib/site-content'
import { Logo } from './Logo'

const navItems = [
  { to: '/manager', label: 'Overview', end: true },
  { to: '/manager/orders', label: 'Orders', end: false },
  { to: '/manager/customers', label: 'Customers', end: false },
]

export function ManagerShell() {
  const { signOut } = useAuth()
  const { orders } = useData()
  const { settings } = useSiteSettings()
  const navigate = useNavigate()
  const pending = orders.filter((order) => order.status === 'Pending').length

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
          <button type="button" className="admin-topbar__signout" onClick={() => void handleSignOut()} aria-label="Sign out">
            Sign out
          </button>
        </header>

        <main className="admin-main"><Outlet /></main>

        <nav className="admin-tabbar" aria-label="Manager navigation">
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
    </div>
  )
}
