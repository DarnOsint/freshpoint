import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LogOut, Mail, Phone, UserRound } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { initials } from '../../lib/format'

const accountTypeLabels: Record<string, string> = {
  household: 'Household',
  retailer: 'Retail shop',
  restaurant: 'Restaurant / Hotel',
  wholesale: 'Wholesale buyer',
}

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const fullName = (user?.user_metadata?.full_name as string | undefined) || 'FreshPoint customer'
  const username = (user?.user_metadata?.username as string | undefined) ?? '—'
  const email = (user?.user_metadata?.email as string | undefined) || user?.email || '—'
  const accountType = (user?.user_metadata?.account_type as string | undefined) ?? 'household'

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div><p className="eyebrow">Your account</p><h1>Profile</h1></div>
      </header>

      <section className="profile-hero">
        <span className="profile-avatar">{initials(fullName)}</span>
        <div><h2>{fullName}</h2><p>@{username} · {accountTypeLabels[accountType] ?? accountType}</p></div>
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>Account details</h2></div>
        <div className="account-details">
          <div><span><UserRound size={17} /> Username</span><strong>{username}</strong></div>
          <div><span><Phone size={17} /> Phone number</span><strong>{user?.phone ?? '—'}</strong></div>
          <div><span><Mail size={17} /> Email address</span><strong>{email}</strong></div>
          <div><span><ArrowRight size={17} /> Account type</span><strong>{accountTypeLabels[accountType] ?? accountType}</strong></div>
        </div>
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>More</h2></div>
        <div className="link-list">
          <Link to="/app/orders" className="link-row"><span>My orders <small>Review past orders and delivery status</small></span><ArrowRight size={18} /></Link>
          <Link to="/#contact" className="link-row"><span>Contact support <small>Questions about an order or delivery?</small></span><ArrowRight size={18} /></Link>
        </div>
      </section>

      <button className="btn btn--outline btn--block btn--large" type="button" onClick={() => void handleSignOut()}>
        <LogOut size={17} /> Sign out
      </button>
    </div>
  )
}
