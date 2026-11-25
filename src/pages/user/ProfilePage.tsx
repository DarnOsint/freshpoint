import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LogOut, Mail, Phone, UserRound } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { initials } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.profile
  const common = settings.interface.common
  const navigate = useNavigate()
  const fullName = (user?.user_metadata?.full_name as string | undefined) || common.customerFallback
  const username = (user?.user_metadata?.username as string | undefined) ?? common.notApplicable
  const email = (user?.user_metadata?.email as string | undefined) || user?.email || common.notApplicable
  const accountType = (user?.user_metadata?.account_type as keyof typeof settings.interface.app.accountTypes | undefined) ?? 'household'

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.heading}</h1></div>
      </header>

      <section className="profile-hero">
        <span className="profile-avatar">{initials(fullName)}</span>
        <div><h2>{fullName}</h2><p>@{username} · {settings.interface.app.accountTypes[accountType] ?? accountType}</p></div>
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>{copy.accountDetails}</h2></div>
        <div className="account-details">
          <div><span><UserRound size={17} /> {common.usernameLabel}</span><strong>{username}</strong></div>
          <div><span><Phone size={17} /> {copy.phoneLabel}</span><strong>{user?.phone ?? common.notApplicable}</strong></div>
          <div><span><Mail size={17} /> {copy.emailLabel}</span><strong>{email}</strong></div>
          <div><span><ArrowRight size={17} /> {copy.accountType}</span><strong>{settings.interface.app.accountTypes[accountType] ?? accountType}</strong></div>
        </div>
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>{copy.more}</h2></div>
        <div className="link-list">
          <Link to="/app/orders" className="link-row"><span>{copy.myOrders} <small>{copy.myOrdersHint}</small></span><ArrowRight size={18} /></Link>
          <Link to="/#contact" className="link-row"><span>{copy.contactSupport} <small>{copy.contactSupportHint}</small></span><ArrowRight size={18} /></Link>
        </div>
      </section>

      <button className="btn btn--outline btn--block btn--large" type="button" onClick={() => void handleSignOut()}>
        <LogOut size={17} /> {copy.signOut}
      </button>
    </div>
  )
}
