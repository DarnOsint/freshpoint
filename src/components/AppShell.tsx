import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { House, LogOut, ReceiptText, ShoppingBasket, UserRound } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { useData } from '../lib/data-store'
import { useSiteSettings } from '../lib/site-content'
import { Logo } from './Logo'

export function AppShell() {
  const { signOut } = useAuth()
  const { cartCount } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.shell
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { to: '/app', label: copy.home, icon: House, key: 'home' },
    { to: '/app/cart', label: copy.basket, icon: ShoppingBasket, key: 'cart' },
    { to: '/app/orders', label: copy.orders, icon: ReceiptText, key: 'orders' },
    { to: '/app/account', label: copy.profile, icon: UserRound, key: 'profile' },
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
          {navItems.map(({ to, label, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={`app-nav-link${isActive(key, to) ? ' app-nav-link--active' : ''}`}>
              <Icon size={19} /> <span>{label}</span>
              {key === 'cart' && cartCount > 0 ? <em>{cartCount}</em> : null}
            </NavLink>
          ))}
        </nav>
        <button className="app-sidebar__signout" type="button" onClick={() => void handleSignOut()}>
          <LogOut size={18} /> {copy.signOut}
        </button>
      </aside>

      <div className="app-body">
        <header className="app-topbar">
          <div className="app-topbar__brand"><Logo label={settings.brand.appName} /></div>
          <div className="app-topbar__actions">
            <NavLink to="/app/cart" className="app-topbar__icon" aria-label={copy.basketAria.replace('{count}', String(cartCount))}>
              <ShoppingBasket size={21} />
              {cartCount > 0 ? <span className="app-topbar__badge">{cartCount}</span> : null}
            </NavLink>
            <button className="app-topbar__icon" type="button" onClick={() => void handleSignOut()} aria-label={copy.signOut}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="app-main"><Outlet /></main>

        <nav className="app-tabbar" aria-label={copy.navigation}>
          {navItems.map(({ to, label, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={`app-tab${isActive(key, to) ? ' app-tab--active' : ''}`}>
              <span className="app-tab__icon">
                <Icon size={20} />
                {key === 'cart' && cartCount > 0 ? <em>{cartCount}</em> : null}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
