import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, ReceiptText, ShoppingBasket, Store, UserRound } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { useData } from '../lib/data-store'
import { Logo } from './Logo'

const navItems = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/shop', label: 'Shop', icon: Store, end: false },
  { to: '/app/cart', label: 'Basket', icon: ShoppingBasket, end: false },
  { to: '/app/orders', label: 'Orders', icon: ReceiptText, end: false },
  { to: '/app/account', label: 'Account', icon: UserRound, end: false },
]

export function AppShell() {
  const { signOut } = useAuth()
  const { cartCount } = useData()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand"><Logo light /></div>
        <nav className="app-sidebar__nav" aria-label="Account navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-nav-link${isActive ? ' app-nav-link--active' : ''}`}>
              <Icon size={19} /> <span>{label}</span>
              {to === '/app/cart' && cartCount > 0 ? <em>{cartCount}</em> : null}
            </NavLink>
          ))}
        </nav>
        <button className="app-sidebar__signout" type="button" onClick={() => void handleSignOut()}>
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      <div className="app-body">
        <header className="app-topbar">
          <div className="app-topbar__brand"><Logo /></div>
          <div className="app-topbar__actions">
            <NavLink to="/app/cart" className="app-topbar__icon" aria-label={`Basket, ${cartCount} items`}>
              <ShoppingBasket size={21} />
              {cartCount > 0 ? <span className="app-topbar__badge">{cartCount}</span> : null}
            </NavLink>
            <button className="app-topbar__icon" type="button" onClick={() => void handleSignOut()} aria-label="Sign out">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="app-main"><Outlet /></main>

        <nav className="app-tabbar" aria-label="Account navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-tab${isActive ? ' app-tab--active' : ''}`}>
              <span className="app-tab__icon">
                <Icon size={20} />
                {to === '/app/cart' && cartCount > 0 ? <em>{cartCount}</em> : null}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
