import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { PhoneField } from '../components/PhoneField'
import { countries, defaultCountry, isValidNationalNumber, toE164 } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-context'
import type { VerifyState } from '../lib/auth-context'

const SEND_ERROR = 'We couldn’t send your code. Check your number and try again.'

export function LoginPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [countryCode, setCountryCode] = useState(defaultCountry.code)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!isValidNationalNumber(phone)) {
      setError('Enter a valid phone number.')
      return
    }

    const country = countries.find((item) => item.code === countryCode) ?? defaultCountry
    const fullPhone = toE164(country.dial, phone)

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: fullPhone })
      if (authError) throw authError
    } catch {
      setError(SEND_ERROR)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/verify', { state: { phone: fullPhone, mode: 'login' } satisfies VerifyState })
  }

  if (session) return <Navigate to="/account" replace />

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
      <p className="auth-card__intro">Enter your phone number and we’ll text you a one-time code.</p>

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

      <p className="auth-card__hint">We’ll only use your number to sign you in. No password needed.</p>
    </AuthShell>
  )
}
