import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useData } from '../lib/data-store'
import { useSiteSettings } from '../lib/site-content'
import { Logo } from './Logo'

const navItems = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/orders', label: 'Orders', end: false },
  { to: '/admin/products', label: 'Products', end: false },
  { to: '/admin/website', label: 'Website', end: false },
  { to: '/admin/customers', label: 'Customers', end: false },
  { to: '/admin/audit', label: 'Audit', end: false },
]

const tabItems = [
  navItems[0],
  navItems[1],
  navItems[2],
  navItems[4],
  navItems[5],
]

export function AdminShell() {
  const { signOut } = useAuth()
  const { orders } = useData()
  const { settings } = useSiteSettings()
  const navigate = useNavigate()
  const pending = orders.filter((order) => order.status === 'Pending').length

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell admin-shell--admin">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Logo light label={settings.brand.appName} />
          <p>Admin console</p>
        </div>
        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`}>
              <span>{label}</span>
              {to === '/admin/orders' && pending > 0 ? <em>{pending}</em> : null}
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
          <span className="admin-topbar__label">Admin console</span>
          <a href="/admin/website" className="admin-topbar__link">Website</a>
          <button type="button" className="admin-topbar__signout" onClick={() => void handleSignOut()} aria-label="Sign out">
            Sign out
          </button>
        </header>

        <main className="admin-main"><Outlet /></main>

        <nav className="admin-tabbar" aria-label="Admin navigation">
          {tabItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-tab${isActive ? ' app-tab--active' : ''}`}>
              <span>
                {label}
                {to === '/admin/orders' && pending > 0 ? <em>{pending}</em> : null}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
