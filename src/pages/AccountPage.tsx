import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LogOut, Mail, Phone, UserRound } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { useSiteSettings } from '../lib/site-content'

export function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.profile
  const common = settings.interface.common
  const navigate = useNavigate()

  if (loading) {
    return (
      <section className="container simple-page">
        <p>{common.loading}</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="container simple-page">
        <div className="simple-page__card">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{settings.interface.login.heading}</h1>
          <p>{settings.interface.login.intro}</p>
          <div className="simple-page__actions">
            <Link to="/login" className="btn btn--primary">{settings.footer.loginLabel} <ArrowRight size={17} /></Link>
            <Link to="/signup" className="btn btn--outline">{settings.footer.createAccountLabel}</Link>
          </div>
        </div>
      </section>
    )
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) || common.customerFallback
  const username = (user.user_metadata?.username as string | undefined) ?? common.notApplicable
  const email = (user.user_metadata?.email as string | undefined) || user.email || common.notApplicable
  const accountType = (user.user_metadata?.account_type as keyof typeof settings.interface.app.accountTypes | undefined) ?? 'household'

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <section className="container simple-page">
      <div className="simple-page__card">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.heading}, {fullName.split(' ')[0]} 👋</h1>
        <p>{settings.interface.app.dashboard.intro}</p>

        <div className="account-details">
          <div>
            <span><UserRound size={17} /> {settings.interface.signup.fullNameLabel}</span>
            <strong>{fullName}</strong>
          </div>
          <div>
            <span><UserRound size={17} /> {common.usernameLabel}</span>
            <strong>{username}</strong>
          </div>
          <div>
            <span><Phone size={17} /> {copy.phoneLabel}</span>
            <strong>{user.phone ?? common.notApplicable}</strong>
          </div>
          <div>
            <span><Mail size={17} /> {copy.emailLabel}</span>
            <strong>{email}</strong>
          </div>
          <div>
            <span><ArrowRight size={17} /> {copy.accountType}</span>
            <strong>{settings.interface.app.accountTypes[accountType] ?? accountType}</strong>
          </div>
        </div>

        <div className="simple-page__actions">
          <Link to="/app/shop" className="btn btn--primary">{settings.interface.app.dashboard.browseProduce} <ArrowRight size={17} /></Link>
          <button className="btn btn--outline" type="button" onClick={() => void handleSignOut()}>
            <LogOut size={17} /> {copy.signOut}
          </button>
        </div>
      </div>
    </section>
  )
}
