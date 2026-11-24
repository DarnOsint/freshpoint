import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LogOut, Mail, Phone, UserRound } from 'lucide-react'
import { useAuth } from '../lib/auth-context'

const accountTypeLabels: Record<string, string> = {
  household: 'Household',
  retailer: 'Retail shop',
  restaurant: 'Restaurant / Hotel',
  wholesale: 'Wholesale buyer',
}

export function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <section className="container simple-page">
        <p>Checking your account…</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="container simple-page">
        <div className="simple-page__card">
          <p className="eyebrow">Your account</p>
          <h1>Please log in first</h1>
          <p>Log in with your phone number to view your FreshPoint account and place orders.</p>
          <div className="simple-page__actions">
            <Link to="/login" className="btn btn--primary">Log in <ArrowRight size={17} /></Link>
            <Link to="/signup" className="btn btn--outline">Create account</Link>
          </div>
        </div>
      </section>
    )
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) || 'FreshPoint customer'
  const username = (user.user_metadata?.username as string | undefined) ?? '—'
  const email = (user.user_metadata?.email as string | undefined) || user.email || '—'
  const accountType = (user.user_metadata?.account_type as string | undefined) ?? 'household'

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <section className="container simple-page">
      <div className="simple-page__card">
        <p className="eyebrow">Your account</p>
        <h1>Welcome, {fullName.split(' ')[0]} 👋</h1>
        <p>Your FreshPoint account is ready. Our team will be in touch about your orders and deliveries.</p>

        <div className="account-details">
          <div>
            <span><UserRound size={17} /> Full name</span>
            <strong>{fullName}</strong>
          </div>
          <div>
            <span><UserRound size={17} /> Username</span>
            <strong>{username}</strong>
          </div>
          <div>
            <span><Phone size={17} /> Phone number</span>
            <strong>{user.phone ?? '—'}</strong>
          </div>
          <div>
            <span><Mail size={17} /> Email address</span>
            <strong>{email}</strong>
          </div>
          <div>
            <span><ArrowRight size={17} /> Account type</span>
            <strong>{accountTypeLabels[accountType] ?? accountType}</strong>
          </div>
        </div>

        <div className="simple-page__actions">
          <Link to="/#products" className="btn btn--primary">Browse produce <ArrowRight size={17} /></Link>
          <button className="btn btn--outline" type="button" onClick={() => void handleSignOut()}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </div>
    </section>
  )
}
