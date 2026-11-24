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

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}••••${name.slice(-1)}@${domain}`
}

export function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const flow = (location.state as VerifyState | null)?.email ? (location.state as VerifyState) : null

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [fallbackPassword, setFallbackPassword] = useState('')

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

    const password = flow.password || fallbackPassword.trim()
    if (!password) {
      setError('Enter your password to finish verification.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: flow.email, code, password }),
      })
      const result = await response.json() as {
        ok?: boolean
        error?: string
        access_token?: string
        refresh_token?: string
      }
      if (!response.ok || !result.ok || !result.access_token || !result.refresh_token) {
        throw new Error(result.error ?? VERIFY_ERROR)
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      })
      if (sessionError) throw sessionError
      navigate('/app', { replace: true })
    } catch {
      setError(VERIFY_ERROR)
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0 || !flow) return
    setError('')
    try {
      const response = await fetch('/api/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: flow.email }),
      })
      if (!response.ok) throw new Error('resend failed')
      setCountdown(RESEND_SECONDS)
    } catch {
      setError(RESEND_ERROR)
    }
  }

  return (
    <AuthShell
      eyebrow="One last step"
      heading="Verify your email"
      footer={
        <>
          Wrong address? <Link to="/signup">Use a different email</Link>
        </>
      }
    >
      <p className="auth-card__intro">
        We sent a 6-digit code to <strong>{maskEmail(flow.email)}</strong>. Check your inbox and enter it below.
      </p>

      <form onSubmit={handleVerify} className="auth-form">
        <div className="field">
          <label htmlFor="otp">Verification code</label>
          <OtpInput id="otp" value={code} onChange={setCode} disabled={loading} error={error} />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        {!flow.password ? (
          <div className="field">
            <label htmlFor="verify-password">Password</label>
            <input id="verify-password" type="password" autoComplete="current-password"
              placeholder="Your FreshPoint password" value={fallbackPassword}
              onChange={(event) => setFallbackPassword(event.target.value)} />
          </div>
        ) : null}

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
