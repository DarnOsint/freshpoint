import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { OtpInput } from '../components/OtpInput'
import { supabase } from '../lib/supabase'
import type { VerifyState } from '../lib/auth-context'

const RESEND_SECONDS = 30
const VERIFY_ERROR = 'That code isn’t valid or has expired. Request a new one.'
const RESEND_ERROR = 'We couldn’t resend the code. Try again shortly.'

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
    let verified = false
    let user: { id: string } | null = null

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: flow.phone,
        token: code,
        type: 'sms',
      })
      if (verifyError) throw verifyError
      verified = true
      user = data.user ?? data.session?.user ?? null
    } catch {
      setError(VERIFY_ERROR)
      setLoading(false)
      return
    }

    if (flow.mode === 'signup' && flow.details && user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        phone: flow.phone,
        full_name: flow.details.fullName,
        account_type: flow.details.accountType,
        updated_at: new Date().toISOString(),
      })
      if (profileError) console.error('Failed to save FreshPoint profile', profileError)
    }

    if (verified) navigate('/account', { replace: true })
  }

  async function handleResend() {
    if (countdown > 0 || !flow) return
    setError('')
    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({ phone: flow.phone })
      if (resendError) throw resendError
      setCountdown(RESEND_SECONDS)
    } catch {
      setError(RESEND_ERROR)
    }
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
        We sent a 6-digit code to <strong>{maskPhone(flow.phone)}</strong>. It may take a moment to arrive.
      </p>

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
