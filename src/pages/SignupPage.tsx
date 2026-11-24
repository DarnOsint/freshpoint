import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { PhoneField } from '../components/PhoneField'
import { countries, defaultCountry, isValidNationalNumber, toE164 } from '../lib/countries'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { AccountType, VerifyState } from '../lib/auth-context'

const accountTypes: Array<{ value: AccountType; label: string; description: string; icon: string }> = [
  { value: 'household', label: 'Household', description: 'For my home', icon: '🏠' },
  { value: 'retailer', label: 'Retail shop', description: 'Resell produce', icon: '🏪' },
  { value: 'restaurant', label: 'Restaurant', description: 'Kitchen supply', icon: '🍽️' },
  { value: 'wholesale', label: 'Wholesale', description: 'Bulk orders', icon: '📦' },
]

export function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [countryCode, setCountryCode] = useState(defaultCountry.code)
  const [phone, setPhone] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('household')
  const [agreed, setAgreed] = useState(false)
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setNameError('')
    setPhoneError('')
    setFormError('')

    if (fullName.trim().length < 2) setNameError('Please enter your full name.')
    if (!isValidNationalNumber(phone)) setPhoneError('Please enter a valid phone number.')
    if (!agreed) setFormError('Please accept the terms to continue.')
    if (fullName.trim().length < 2 || !isValidNationalNumber(phone) || !agreed) return

    const country = countries.find((item) => item.code === countryCode) ?? defaultCountry
    const fullPhone = toE164(country.dial, phone)

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
      options: {
        data: { full_name: fullName.trim(), account_type: accountType },
      },
    })
    setLoading(false)

    if (authError) {
      setFormError(authError.message)
      return
    }

    navigate('/verify', {
      state: {
        phone: fullPhone,
        mode: 'signup',
        details: { fullName: fullName.trim(), accountType },
      } satisfies VerifyState,
    })
  }

  return (
    <AuthShell
      eyebrow="Get started"
      heading="Create your FreshPoint account"
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <p className="auth-card__intro">Sign up with your phone number — no password to remember.</p>

      {!isSupabaseConfigured ? (
        <div className="notice notice--info">
          <Info size={18} />
          <span>Auth is not configured yet. Add your Supabase URL and anon key to <code>.env</code> to enable SMS signup.</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Mary Achol"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? 'name-error' : undefined}
          />
          {nameError ? <p className="field-error" id="name-error">{nameError}</p> : null}
        </div>

        <PhoneField
          countryCode={countryCode}
          onCountryChange={setCountryCode}
          value={phone}
          onChange={setPhone}
          error={phoneError}
        />

        <fieldset className="account-types">
          <legend>I’m shopping as</legend>
          <div className="account-types__grid">
            {accountTypes.map((type) => (
              <label className={`account-type${accountType === type.value ? ' account-type--active' : ''}`} key={type.value}>
                <input
                  type="radio"
                  name="accountType"
                  value={type.value}
                  checked={accountType === type.value}
                  onChange={() => setAccountType(type.value)}
                />
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
          {loading ? 'Sending code…' : <>Create account <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthShell>
  )
}
