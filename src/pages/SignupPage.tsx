import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { PhoneField } from '../components/PhoneField'
import { countries, defaultCountry, isValidNationalNumber, toE164 } from '../lib/countries'
import { useAuth } from '../lib/auth-context'
import { homePathForUser } from '../lib/roles'
import { useSiteSettings } from '../lib/site-content'
import type { VerifyState } from '../lib/auth-context'

export function SignupPage() {
  const navigate = useNavigate()
  const { session, user } = useAuth()
  const { settings } = useSiteSettings()
  const copy = settings.interface.signup
  const common = settings.interface.common
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [countryCode, setCountryCode] = useState(defaultCountry.code)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [nameError, setNameError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setNameError('')
    setUsernameError('')
    setPhoneError('')
    setEmailError('')
    setPasswordError('')
    setFormError('')

    const cleanUsername = username.trim().toLowerCase()
    const cleanEmail = email.trim().toLowerCase()

    if (fullName.trim().length < 2) setNameError(copy.nameError)
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) setUsernameError(copy.usernameRule)
    if (phone.trim() && !isValidNationalNumber(phone)) setPhoneError(common.validPhone)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) setEmailError(common.validEmail)
    if (password.length < 8) setPasswordError(common.passwordTooShort)
    else if (password !== confirmPassword) setPasswordError(common.passwordMismatch)
    if (!agreed) setFormError(copy.agreeError)

    if (
      fullName.trim().length < 2 ||
      !/^[a-z0-9_]{3,20}$/.test(cleanUsername) ||
      (phone.trim() !== '' && !isValidNationalNumber(phone)) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      password.length < 8 ||
      password !== confirmPassword ||
      !agreed
    ) return

    const country = countries.find((item) => item.code === countryCode) ?? defaultCountry
    const fullPhone = phone.trim() ? toE164(country.dial, phone) : undefined

    setLoading(true)
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          fullName: fullName.trim(),
          username: cleanUsername,
          phone: fullPhone,
        }),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setFormError(result.error ?? copy.error)
        setLoading(false)
        return
      }

      setLoading(false)
      navigate('/verify', {
        state: {
          email: cleanEmail,
          password,
          mode: 'signup',
          details: {
            fullName: fullName.trim(),
            username: cleanUsername,
            email: cleanEmail,
            phone: fullPhone,
          },
        } satisfies VerifyState,
      })
    } catch {
      setFormError(copy.error)
      setLoading(false)
    }
  }

  if (session) return <Navigate to={homePathForUser(user)} replace />

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      heading={copy.heading}
      footer={<>{copy.alreadyAccount} <Link to="/login">{copy.loginLink}</Link></>}
    >
      <p className="auth-card__intro">{copy.intro}</p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field">
          <label htmlFor="fullName">{copy.fullNameLabel}</label>
          <input id="fullName" type="text" autoComplete="name" placeholder={copy.fullNamePlaceholder} value={fullName}
            onChange={(event) => setFullName(event.target.value)} aria-invalid={Boolean(nameError)} />
          {nameError ? <p className="field-error">{nameError}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="username">{common.usernameLabel}</label>
          <input id="username" type="text" autoComplete="username" placeholder={common.usernamePlaceholder}
            value={username} onChange={(event) => setUsername(event.target.value)} aria-invalid={Boolean(usernameError)} />
          {usernameError ? <p className="field-error">{usernameError}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="email">{common.emailLabel}</label>
          <input id="email" type="email" autoComplete="email" placeholder={common.emailPlaceholder}
            value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(emailError)} />
          {emailError ? <p className="field-error">{emailError}</p> : null}
        </div>

        <PhoneField
          countryCode={countryCode}
          onCountryChange={setCountryCode}
          value={phone}
          onChange={setPhone}
          optional
          error={phoneError}
        />

        <div className="field">
          <label htmlFor="password">{common.passwordLabel}</label>
          <div className="password-input">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
              placeholder={copy.passwordPlaceholder} value={password}
              onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(passwordError)} />
            <button type="button" className="password-input__toggle" onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? common.hidePassword : common.showPassword}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordError ? <p className="field-error">{passwordError}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="confirmPassword">{copy.confirmPasswordLabel}</label>
          <div className="password-input">
            <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password"
              placeholder={copy.confirmPasswordPlaceholder} value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={Boolean(passwordError)} />
            <button type="button" className="password-input__toggle"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? common.hideConfirmation : common.showConfirmation}>
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          <span>{copy.terms}</span>
        </label>

        {formError ? <p className="field-error">{formError}</p> : null}

        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? copy.creating : <>{copy.submit} <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthShell>
  )
}
