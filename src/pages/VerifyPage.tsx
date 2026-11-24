import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Info, RefreshCw } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { OtpInput } from '../components/OtpInput'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { VerifyState } from '../lib/auth-context'

const RESEND_SECONDS = 30

function maskPhone(phone: string) {
  return `${phone.slice(0, 5)}••••${phone.slice(-3)}`
}

export function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const flow = (location.state as VerifyState | null)?.phone ? (location.state as VerifyState) : null

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (!flow) return
    const timer = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [flow])

  if (!flow) return <Navigate to="/login" replace />

  async function handleVerify(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('Enter the full 6-digit code.')
      return
    }

    if (!flow) return

    setLoading(true)
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: flow.phone,
      token: code,
      type: 'sms',
    })
    setLoading(false)

    if (verifyError) {
      setError(verifyError.message)
      return
    }

    if (flow.mode === 'signup' && flow.details && data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        phone: flow.phone,
        full_name: flow.details.fullName,
        account_type: flow.details.accountType,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        setError(`Account verified, but your profile could not be saved: ${profileError.message}`)
        return
      }
    }

    navigate('/account', { replace: true })
  }

  async function handleResend() {
    if (countdown > 0 || !flow) return
    setError('')
    const { error: resendError } = await supabase.auth.signInWithOtp({ phone: flow.phone })
    if (resendError) {
      setError(resendError.message)
      return
    }
    setCountdown(RESEND_SECONDS)
  }

  return (
    <AuthShell
      eyebrow="One last step"
      heading="Verify your phone"
      footer={
        <>
          Wrong number? <Link to={flow.mode === 'signup' ? '/signup' : '/login'}>Use a different number</Link>
        </>
      }
    >
      <p className="auth-card__intro">
        We sent a 6-digit code via SMS to <strong>{maskPhone(flow.phone)}</strong>. It may take a moment to arrive.
      </p>

      {!isSupabaseConfigured ? (
        <div className="notice notice--info">
          <Info size={18} />
          <span>SMS verification needs Supabase configuration. See <code>.env.example</code> for setup.</span>
        </div>
      ) : null}

      <form onSubmit={handleVerify} className="auth-form">
        <div className="field">
          <label htmlFor="otp">Verification code</label>
          <OtpInput id="otp" value={code} onChange={setCode} disabled={loading} error={error} />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? 'Verifying…' : <>Verify &amp; continue <ArrowRight size={18} /></>}
        </button>
      </form>

      <button className="resend-button" type="button" onClick={() => void handleResend()} disabled={countdown > 0}>
        <RefreshCw size={15} />
        {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
      </button>
    </AuthShell>
  )
}
