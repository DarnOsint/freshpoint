import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react'
import { navigation } from '../config'
import { useAuth } from '../lib/auth-context'
import { isAdmin, homePathForUser } from '../lib/roles'
import { Logo } from './Logo'

export function Header() {
  const [open, setOpen] = useState(false)
  const { session, user, signOut } = useAuth()

  return (
    <header className="site-header">
      <div className="announcement">
        <span>🌱 Farm-fresh produce, delivered across Juba</span>
        <span className="announcement__dot">•</span>
        <span>Retail &amp; wholesale orders welcome</span>
      </div>

      <div className="container header__inner">
        <Logo />

        <nav className={`main-nav${open ? ' main-nav--open' : ''}`} aria-label="Main navigation">
          {navigation.map((item) => (
            <Link key={item.label} to={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}

          <div className="main-nav__auth">
            {session ? (
              <>
                <Link to={homePathForUser(user)} className="btn btn--outline btn--small" onClick={() => setOpen(false)}>
                  {isAdmin(user) ? <ShieldCheck size={16} /> : <UserRound size={16} />}
                  {isAdmin(user) ? 'Admin console' : 'My account'}
                </Link>
                <button className="btn btn--ghost btn--small" onClick={() => void signOut()} type="button">
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--outline btn--small" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className="btn btn--primary btn--small" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>

        <button
          className="nav-toggle"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  )
}
