import { Link, useNavigate } from 'react-router-dom'
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
            <Link to="/login" className="btn btn--primary">{settings.footer.loginLabel}</Link>
            <Link to="/signup" className="btn btn--outline">{settings.footer.createAccountLabel}</Link>
          </div>
        </div>
      </section>
    )
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) || common.customerFallback
  const username = (user.user_metadata?.username as string | undefined) ?? common.notApplicable
  const email = (user.user_metadata?.email as string | undefined) || user.email || common.notApplicable

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <section className="container simple-page">
      <div className="simple-page__card">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.heading}, {fullName.split(' ')[0]}</h1>
        <p>{settings.interface.app.dashboard.intro}</p>

        <div className="account-details">
          <div>
            <span>{settings.interface.signup.fullNameLabel}</span>
            <strong>{fullName}</strong>
          </div>
          <div>
            <span>{common.usernameLabel}</span>
            <strong>{username}</strong>
          </div>
          <div>
            <span>{copy.phoneLabel}</span>
            <strong>{user.phone ?? common.notApplicable}</strong>
          </div>
          <div>
            <span>{copy.emailLabel}</span>
            <strong>{email}</strong>
          </div>
        </div>

        <div className="simple-page__actions">
          <Link to="/app/shop" className="btn btn--primary">{settings.interface.app.dashboard.browseProduce}</Link>
          <button className="btn btn--outline" type="button" onClick={() => void handleSignOut()}>
            {copy.signOut}
          </button>
        </div>
      </div>
    </section>
  )
}
