import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { PhoneField } from '../components/PhoneField'
import { countries, defaultCountry, isValidNationalNumber, toE164 } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-context'
import { homePathForUser } from '../lib/roles'
import { useSiteSettings } from '../lib/site-content'

type LoginMethod = 'phone' | 'email' | 'username'
type UsernameLookup = { identifier: string; kind: 'phone' | 'email' }

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
  const [loading, setLoading] = useState(false)

  function flagLogin() {
    try {
      window.sessionStorage.setItem('freshpoint:pending-login', '1')
    } catch {
      // Activity tracking is best-effort.
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!password) {
      setError(copy.enterPassword)
      return
    }

    const selectedCountry = countries.find((item) => item.code === countryCode) ?? defaultCountry
    if (method === 'phone' && !isValidNationalNumber(phone, selectedCountry.dial)) {
      setError(common.validPhone)
      return
    }
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(common.validEmail)
      return
    }
    if (method === 'username' && !/^[a-z0-9_]{3,20}$/i.test(username.trim())) {
      setError(common.validUsername)
      return
    }

    setLoading(true)
    let signedInUser = user
    try {
      let identifier = ''
      let usePhone = method === 'phone'

      if (method === 'phone') {
        const country = countries.find((item) => item.code === countryCode) ?? defaultCountry
        identifier = toE164(country.dial, phone)

        // Email is the reliable identifier when a project has phone sign-in disabled.
        const { data, error: lookupError } = await supabase.rpc('login_identifier_for_phone', {
          p_phone: identifier,
        })
        if (!lookupError) {
          const linkedEmail = (data as Array<{ email: string }> | null)?.[0]?.email
          if (linkedEmail) {
            const { data: signedIn, error: emailError } = await supabase.auth.signInWithPassword({
              email: linkedEmail,
              password,
            })
            if (!emailError) {
              signedInUser = signedIn.user
              setLoading(false)
              flagLogin()
              navigate(homePathForUser(signedInUser), { replace: true })
              return
            }
          }
        }
      } else if (method === 'email') {
        identifier = email.trim()
      } else {
        const { data, error: lookupError } = await supabase.rpc('login_identifier_for_username', {
          p_username: username.trim(),
        })
        if (lookupError) throw lookupError
        const match = (data as UsernameLookup[] | null)?.[0]
        if (!match) throw new Error('No login found')
        identifier = match.identifier
        usePhone = match.kind === 'phone'
      }

      const { data: signedIn, error: authError } = usePhone
        ? await supabase.auth.signInWithPassword({ phone: identifier, password })
        : await supabase.auth.signInWithPassword({ email: identifier, password })
      if (authError) throw authError
      signedInUser = signedIn.user
    } catch {
      setError(copy.error)
      setLoading(false)
      return
    }

    setLoading(false)
    flagLogin()
    navigate(homePathForUser(signedInUser), { replace: true })
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
            />
            <button
              type="button"
              className="password-input__toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? common.hidePassword : common.showPassword}
            >
              {showPassword ? common.hidePassword : common.showPassword}
            </button>
          </div>
        </div>

        <div className="auth-link-row"><Link to="/forgot-password">{common.forgotPassword}</Link></div>

        {error && method !== 'phone' ? <p className="field-error">{error}</p> : null}

        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? copy.loggingIn : copy.submit}
        </button>
      </form>
    </AuthShell>
  )
}
