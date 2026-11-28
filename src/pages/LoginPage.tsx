import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { PhoneField } from '../components/PhoneField'
import { countries, defaultCountry, isValidNationalNumber, toE164 } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-context'
import { submitLogin, type LoginMethod } from '../lib/login'
import { homePathForUser } from '../lib/roles'
import { useSiteSettings } from '../lib/site-content'

export function LoginPage() {
  const navigate = useNavigate()
  const { session, user } = useAuth()
  const { settings } = useSiteSettings()
  const copy = settings.interface.login
  const common = settings.interface.common
  const methods: Array<{ value: LoginMethod; label: string }> = [
    { value: 'phone', label: copy.phoneMethod },
    { value: 'email', label: copy.emailMethod },
    { value: 'username', label: copy.usernameMethod },
  ]
  const [method, setMethod] = useState<LoginMethod>('phone')
  const [countryCode, setCountryCode] = useState(defaultCountry.code)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState(false)
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  function flagLogin() {
    try {
      window.sessionStorage.setItem('freshpoint:pending-login', '1')
    } catch {
      // Activity tracking is best-effort.
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submittingRef.current) return
    setError('')
    setServerError(false)

    if (!password) {
      setError(copy.enterPassword)
      return
    }

    const selectedCountry = countries.find((item) => item.code === countryCode) ?? defaultCountry
    let identifier = ''
    if (method === 'phone') {
      if (!isValidNationalNumber(phone, selectedCountry.dial)) {
        setError(common.validPhone)
        return
      }
      identifier = toE164(selectedCountry.dial, phone)
    } else if (method === 'email') {
      identifier = email.trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        setError(common.validEmail)
        return
      }
    } else {
      identifier = username.trim()
      if (!/^[a-z0-9_]{3,20}$/i.test(identifier)) {
        setError(common.validUsername)
        return
      }
    }

    submittingRef.current = true
    setLoading(true)
    try {
      const outcome = await submitLogin({ surface: 'customer', method, identifier, password })
      if ('error' in outcome) {
        setError(outcome.error || copy.error)
        setServerError(true)
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

      flagLogin()
      navigate(homePathForUser(outcome.user), { replace: true })
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  if (session) return <Navigate to={homePathForUser(user)} replace />

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      heading={copy.heading}
      footer={<>{copy.newHere} <Link to="/signup">{copy.createAccount}</Link></>}
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
        {method === 'phone' ? (
          <PhoneField
            countryCode={countryCode}
            onCountryChange={setCountryCode}
            value={phone}
            onChange={setPhone}
            error={method === 'phone' ? error : undefined}
            disabled={loading}
          />
        ) : (
          <div className="field">
            <label htmlFor="identifier">{method === 'email' ? common.emailLabel : common.usernameLabel}</label>
            <input
              id="identifier"
              type={method === 'email' ? 'email' : 'text'}
              inputMode={method === 'email' ? 'email' : 'text'}
              autoComplete={method === 'email' ? 'email' : 'username'}
              placeholder={method === 'email' ? common.emailPlaceholder : common.usernamePlaceholder}
              value={method === 'email' ? email : username}
              onChange={(event) => (method === 'email' ? setEmail(event.target.value) : setUsername(event.target.value))}
              aria-invalid={Boolean(error)}
              disabled={loading}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="password">{common.passwordLabel}</label>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={common.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
              disabled={loading}
            />
            <button
              type="button"
              className="password-input__toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? common.hidePassword : common.showPassword}
              disabled={loading}
            >
              {showPassword ? common.hidePassword : common.showPassword}
            </button>
          </div>
        </div>

        <div className="auth-link-row"><Link to="/forgot-password">{common.forgotPassword}</Link></div>

        {error && (method !== 'phone' || serverError) ? <p className="field-error">{error}</p> : null}

        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? copy.loggingIn : copy.submit}
        </button>
      </form>
    </AuthShell>
  )
}
