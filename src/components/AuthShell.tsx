import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../lib/site-content'
import { Logo } from './Logo'

type AuthShellProps = {
  eyebrow: string
  heading: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ eyebrow, heading, children, footer }: AuthShellProps) {
  const { settings } = useSiteSettings()
  const copy = settings.interface.authPanel

  return (
    <section className="auth-layout">
      <aside className="auth-panel">
        <Logo light label={settings.brand.appName} />
        <div className="auth-panel__content">
          <p className="eyebrow eyebrow--light">{copy.eyebrow}</p>
          <h2>{copy.heading}</h2>
          <p>{copy.body}</p>
          <ul>
            {copy.points.map((point, index) => (
              <li key={`${point.text}-${index}`}>{point.text}</li>
            ))}
          </ul>
        </div>
        <p className="auth-panel__brand">{copy.brandLine}</p>
      </aside>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card__mobile-logo"><Logo label={settings.brand.appName} /></div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{heading}</h1>
          {children}
          <div className="auth-card__footer">{footer}</div>
          <Link to="/" className="auth-card__back">{copy.backHome}</Link>
        </div>
      </div>
    </section>
  )
}
