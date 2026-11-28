import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { useAuth } from '../../lib/auth-context'
import { submitLogin } from '../../lib/login'
import { useSiteSettings } from '../../lib/site-content'
import { supabase } from '../../lib/supabase'
import { homePathForUser, isAdmin } from '../../lib/roles'

type Method = 'email' | 'username'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { settings } = useSiteSettings()
  const copy = settings.interface.adminLogin
  const common = settings.interface.common
  const [method, setMethod] = useState<Method>('email')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  if (user) return <Navigate to={isAdmin(user) ? '/admin' : homePathForUser(user)} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submittingRef.current) return
    setError('')
    const identifier = (method === 'email' ? email : username).trim()

    if (!identifier || !password) {
      setError(copy.enterDetails)
      return
    }
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setError(common.validEmail)
      return
    }

    submittingRef.current = true
    setLoading(true)
    try {
      const outcome = await submitLogin({ surface: 'admin', method, identifier, password })
      if ('error' in outcome) {
        setError(outcome.error || copy.error)
        return
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: outcome.accessToken,
        refresh_token: outcome.refreshToken,
      })
      if (sessionError) {
        setError(copy.error)
        return
      }
      if (!isAdmin(outcome.user)) {
        await supabase.auth.signOut()
        setError(copy.error)
        return
      }

      navigate('/admin', { replace: true })
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const methods: Array<{ value: Method; label: string }> = [
    { value: 'email', label: copy.emailMethod },
    { value: 'username', label: copy.usernameMethod },
  ]

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      heading={copy.heading}
      footer={<>{copy.footer} <Link to="/login">{copy.goToLogin}</Link></>}
    >
      <p className="auth-card__intro">{copy.intro}</p>

      <div className="login-methods" role="tablist" aria-label={copy.methodLabel}>
        {methods.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={method === item.value}
            className={`login-method${method === item.value ? ' login-method--active' : ''}`}
            onClick={() => { setMethod(item.value); setError('') }}
            disabled={loading}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field">
          <label htmlFor="adminIdentifier">{method === 'email' ? common.emailLabel : common.usernameLabel}</label>
          <input
            id="adminIdentifier"
            type={method === 'email' ? 'email' : 'text'}
            autoComplete={method === 'email' ? 'email' : 'username'}
            placeholder={method === 'email' ? common.emailPlaceholder : common.usernamePlaceholder}
            value={method === 'email' ? email : username}
            onChange={(event) => (method === 'email' ? setEmail(event.target.value) : setUsername(event.target.value))}
            disabled={loading}
          />
        </div>
        <div className="field">
          <label htmlFor="adminPassword">{common.passwordLabel}</label>
          <div className="password-input">
            <input
              id="adminPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={common.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
            <button type="button" className="password-input__toggle" onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? common.hidePassword : common.showPassword} disabled={loading}>
              {showPassword ? common.hidePassword : common.showPassword}
            </button>
          </div>
        </div>
        <div className="auth-link-row"><Link to="/forgot-password">{common.forgotPassword}</Link></div>
        {error ? <p className="field-error">{error}</p> : null}
        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? copy.signingIn : copy.submit}
        </button>
      </form>
    </AuthShell>
  )
}
