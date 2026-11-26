import { Link } from 'react-router-dom'
import { Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { isHiddenPhoneSection, useSiteSettings } from '../lib/site-content'
import { Logo } from './Logo'

const year = new Date().getFullYear()

export function Footer() {
  const { settings } = useSiteSettings()
  const copy = settings.interface.common

  return (
    <footer className="site-footer" id="contact">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo light label={settings.brand.appName} />
          <p>{settings.brand.footerAbout}</p>
          <small className="footer__tagline">{settings.brand.footerTagline}</small>
          <div className="footer__social">
            <Link to="/" aria-label={`${settings.brand.appName} home`}>
              <Globe size={18} />
            </Link>
            <a href={`mailto:${settings.contact.email}`} aria-label={copy.messageUs}>
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        <div className="footer__explore">
          <h3>{settings.footer.exploreTitle}</h3>
          <ul className="footer__links">
            {settings.navigation.map((item) => (
              <li key={`${item.label}-${item.href}`} className={isHiddenPhoneSection(item.href) ? 'section-link' : undefined}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
            <li className="footer__auth"><Link to="/signup">{settings.footer.createAccountLabel}</Link></li>
            <li className="footer__auth"><Link to="/login">{settings.footer.loginLabel}</Link></li>
          </ul>
        </div>

        <div>
          <h3>{settings.footer.contactTitle}</h3>
          <ul className="footer__links footer__contact">
            <li><MapPin size={16} /> {settings.contact.location}</li>
            <li><Phone size={16} /> <a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`}>{settings.contact.phone}</a></li>
            <li><Mail size={16} /> <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a></li>
            <li>{settings.contact.hours}</li>
          </ul>
        </div>

        <div className="footer__cta">
          <h3>{settings.footer.ctaTitle}</h3>
          <p>{settings.footer.ctaBody}</p>
          <Link to="/signup" className="btn btn--primary btn--small">{settings.footer.ctaLabel}</Link>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© {year} {settings.brand.copyright}</p>
        <p>{settings.footer.bottomLine}</p>
      </div>
    </footer>
  )
}
