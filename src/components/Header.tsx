import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { isAdmin, homePathForUser } from '../lib/roles'
import { isHiddenPhoneSection, useSiteSettings } from '../lib/site-content'
import { Logo } from './Logo'

export function Header() {
  const [open, setOpen] = useState(false)
  const { session, user, signOut } = useAuth()
  const { settings } = useSiteSettings()
  const copy = settings.interface.common

  return (
    <header className="site-header">
      <div className="announcement">
        <span>{settings.announcement.primary}</span>
        <span>{settings.announcement.secondary}</span>
      </div>

      <div className="container header__inner">
        <Logo label={settings.brand.appName} />

        <nav className={`main-nav${open ? ' main-nav--open' : ''}`} aria-label={copy.mainNavigation}>
          {settings.navigation.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              to={item.href}
              className={isHiddenPhoneSection(item.href) ? 'section-link' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="main-nav__auth">
            {session ? (
              <>
                <Link to={homePathForUser(user)} className="btn btn--outline btn--small" onClick={() => setOpen(false)}>
                  {isAdmin(user) ? copy.adminConsole : copy.myAccount}
                </Link>
                <button className="btn btn--ghost btn--small" onClick={() => void signOut()} type="button">
                  {copy.signOut}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--outline btn--small" onClick={() => setOpen(false)}>
                  {settings.footer.loginLabel}
                </Link>
                <Link to="/signup" className="btn btn--primary btn--small" onClick={() => setOpen(false)}>
                  {settings.footer.createAccountLabel}
                </Link>
              </>
            )}
          </div>
        </nav>

        <button
          className="nav-toggle"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
    </header>
  )
}
