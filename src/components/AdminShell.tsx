import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardList, ExternalLink, Globe, LayoutDashboard, LogOut, Package, UsersRound } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { useData } from '../lib/data-store'
import { Logo } from './Logo'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList, end: false },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/website', label: 'Website', icon: Globe, end: false },
  { to: '/admin/customers', label: 'Customers', icon: UsersRound, end: false },
]

export function AdminShell() {
  const { signOut } = useAuth()
  const { orders } = useData()
  const navigate = useNavigate()
  const pending = orders.filter((order) => order.status === 'Pending').length

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Logo light />
          <p>Admin console</p>
        </div>
        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`}>
              <Icon size={19} /> <span>{label}</span>
              {to === '/admin/orders' && pending > 0 ? <em>{pending}</em> : null}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <a href="/" className="admin-nav-link"><ExternalLink size={18} /> <span>View website</span></a>
          <button type="button" onClick={() => void handleSignOut()}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <div className="admin-topbar__brand"><Logo /></div>
          <span className="admin-topbar__label">Admin console</span>
          <button type="button" className="admin-topbar__signout" onClick={() => void handleSignOut()} aria-label="Sign out">
            <LogOut size={19} />
          </button>
        </header>

        <main className="admin-main"><Outlet /></main>

        <nav className="admin-tabbar" aria-label="Admin navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-tab${isActive ? ' app-tab--active' : ''}`}>
              <span className="app-tab__icon">
                <Icon size={20} />
                {to === '/admin/orders' && pending > 0 ? <em>{pending}</em> : null}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
