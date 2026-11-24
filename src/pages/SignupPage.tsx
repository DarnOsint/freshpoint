import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { PhoneField } from '../components/PhoneField'
import { countries, defaultCountry, isValidNationalNumber, toE164 } from '../lib/countries'
import { useAuth } from '../lib/auth-context'
import { homePathForUser } from '../lib/roles'
import type { AccountType, VerifyState } from '../lib/auth-context'

const accountTypes: Array<{ value: AccountType; label: string; description: string; icon: string }> = [
  { value: 'household', label: 'Household', description: 'For my home', icon: '🏠' },
  { value: 'retailer', label: 'Retail shop', description: 'Resell produce', icon: '🏪' },
  { value: 'restaurant', label: 'Restaurant', description: 'Kitchen supply', icon: '🍽️' },
  { value: 'wholesale', label: 'Wholesale', description: 'Bulk orders', icon: '📦' },
]

const SEND_ERROR = 'We couldn’t create your account. Check your details and try again.'

export function SignupPage() {
  const navigate = useNavigate()
  const { session, user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [countryCode, setCountryCode] = useState(defaultCountry.code)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('household')
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

    if (fullName.trim().length < 2) setNameError('Enter your full name.')
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) setUsernameError('Use 3–20 letters, numbers or underscores.')
    if (phone.trim() && !isValidNationalNumber(phone)) setPhoneError('Enter a valid phone number.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) setEmailError('Enter a valid email address.')
    if (password.length < 8) setPasswordError('Use at least 8 characters.')
    else if (password !== confirmPassword) setPasswordError('Passwords do not match.')
    if (!agreed) setFormError('Accept the terms to continue.')

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
          accountType,
        }),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setFormError(result.error ?? SEND_ERROR)
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
            accountType,
          },
        } satisfies VerifyState,
      })
    } catch {
      setFormError(SEND_ERROR)
      setLoading(false)
    }
  }

  if (session) return <Navigate to={homePathForUser(user)} replace />

  return (
    <AuthShell
      eyebrow="Get started"
      heading="Create your account"
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <p className="auth-card__intro">Sign up with your email, add a phone number if you like, then log in with whichever you prefer.</p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" type="text" autoComplete="name" placeholder="e.g. Mary Achol" value={fullName}
            onChange={(event) => setFullName(event.target.value)} aria-invalid={Boolean(nameError)} />
          {nameError ? <p className="field-error">{nameError}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" type="text" autoComplete="username" placeholder="e.g. mary_achol"
            value={username} onChange={(event) => setUsername(event.target.value)} aria-invalid={Boolean(usernameError)} />
          {usernameError ? <p className="field-error">{usernameError}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" autoComplete="email" placeholder="you@example.com"
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
          <label htmlFor="password">Password</label>
          <div className="password-input">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
              placeholder="At least 8 characters" value={password}
              onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(passwordError)} />
            <button type="button" className="password-input__toggle" onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordError ? <p className="field-error">{passwordError}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="password-input">
            <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password"
              placeholder="Repeat your password" value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={Boolean(passwordError)} />
            <button type="button" className="password-input__toggle"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}>
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <fieldset className="account-types">
          <legend>I’m shopping as</legend>
          <div className="account-types__grid">
            {accountTypes.map((type) => (
              <label className={`account-type${accountType === type.value ? ' account-type--active' : ''}`} key={type.value}>
                <input type="radio" name="accountType" value={type.value} checked={accountType === type.value}
                  onChange={() => setAccountType(type.value)} />
                <span className="account-type__icon" aria-hidden="true">{type.icon}</span>
                <strong>{type.label}</strong>
                <small>{type.description}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="checkbox-row">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          <span>I agree to the terms of service and privacy policy.</span>
        </label>

        {formError ? <p className="field-error">{formError}</p> : null}

        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : <>Create account <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthShell>
  )
}
