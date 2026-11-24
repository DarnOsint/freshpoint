import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { PhoneField } from '../components/PhoneField'
import { countries, defaultCountry, isValidNationalNumber, toE164 } from '../lib/countries'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { VerifyState } from '../lib/auth-context'

export function LoginPage() {
  const navigate = useNavigate()
  const [countryCode, setCountryCode] = useState(defaultCountry.code)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!isValidNationalNumber(phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    const country = countries.find((item) => item.code === countryCode) ?? defaultCountry
    const fullPhone = toE164(country.dial, phone)

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOtp({ phone: fullPhone })
    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    navigate('/verify', { state: { phone: fullPhone, mode: 'login' } satisfies VerifyState })
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      heading="Log in to FreshPoint"
      footer={
        <>
          New to FreshPoint? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <p className="auth-card__intro">Enter your phone number and we’ll send you a one-time code to log in.</p>

      {!isSupabaseConfigured ? (
        <div className="notice notice--info">
          <Info size={18} />
          <span>Auth is not configured yet. Add your Supabase URL and anon key to <code>.env</code> to enable SMS login.</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <PhoneField
          countryCode={countryCode}
          onCountryChange={setCountryCode}
          value={phone}
          onChange={setPhone}
          error={error}
        />
        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? 'Sending code…' : <>Send me a code <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="auth-card__hint">By continuing you agree to our terms and privacy policy.</p>
    </AuthShell>
  )
}
