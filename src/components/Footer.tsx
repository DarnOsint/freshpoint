import { Link } from 'react-router-dom'
import { Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { config, navigation } from '../config'
import { Logo } from './Logo'

const year = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p>
            Connecting farmers, trusted suppliers and consumers through quality produce, reliable sourcing and
            doorstep delivery across South Sudan.
          </p>
          <div className="footer__social">
            <Link to="/" aria-label="FreshPoint home">
              <Globe size={18} />
            </Link>
            <a href={`mailto:${config.email}`} aria-label="Message us">
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        <div>
          <h3>Explore</h3>
          <ul className="footer__links">
            {navigation.map((item) => (
              <li key={item.label}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
            <li><Link to="/signup">Create account</Link></li>
            <li><Link to="/login">Log in</Link></li>
          </ul>
        </div>

        <div>
          <h3>Get in touch</h3>
          <ul className="footer__links footer__contact">
            <li><MapPin size={16} /> {config.location}</li>
            <li><Phone size={16} /> <a href={`tel:${config.phone.replace(/\s/g, '')}`}>{config.phone}</a></li>
            <li><Mail size={16} /> <a href={`mailto:${config.email}`}>{config.email}</a></li>
            <li>{config.hours}</li>
          </ul>
        </div>

        <div className="footer__cta">
          <h3>Ready to shop fresh?</h3>
          <p>Create your account to order retail or wholesale produce.</p>
          <Link to="/signup" className="btn btn--primary btn--small">Join FreshPoint</Link>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© {year} FreshPoint. A OnePlan Enterprise brand.</p>
        <p>OrganicPoint / FreshPoint — from farm to market.</p>
      </div>
    </footer>
  )
}
