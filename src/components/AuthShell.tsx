import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Leaf, Sprout, Truck } from 'lucide-react'
import { Logo } from './Logo'

type AuthShellProps = {
  eyebrow: string
  heading: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ eyebrow, heading, children, footer }: AuthShellProps) {
  return (
    <section className="auth-layout">
      <aside className="auth-panel">
        <Logo light />
        <div className="auth-panel__content">
          <p className="eyebrow eyebrow--light"><Leaf size={15} /> Your Everyday Fresh Market</p>
          <h2>Good food starts with a simple order.</h2>
          <p>
            Join FreshPoint to shop fresh produce, manage wholesale orders and get quality essentials delivered
            to your door.
          </p>
          <ul>
            <li><BadgeCheck size={18} /> Quality-checked farm produce</li>
            <li><Sprout size={18} /> Sourced from local farmers &amp; suppliers</li>
            <li><Truck size={18} /> Retail, wholesale and doorstep delivery</li>
          </ul>
        </div>
        <p className="auth-panel__brand">A OnePlan Enterprise brand · OrganicPoint / FreshPoint</p>
      </aside>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card__mobile-logo"><Logo /></div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{heading}</h1>
          {children}
          <div className="auth-card__footer">{footer}</div>
          <Link to="/" className="auth-card__back">← Back to FreshPoint home</Link>
        </div>
      </div>
    </section>
  )
}
