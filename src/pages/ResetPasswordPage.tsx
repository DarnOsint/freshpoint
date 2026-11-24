import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { OtpInput } from '../components/OtpInput'

const RESEND_SECONDS = 30
const INVALID = 'That code isn’t valid or has expired. Request a new one.'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState((params.get('code') ?? '').replace(/\D/g, '').slice(0, 6))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (done) return
    const timer = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [done])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const cleanEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.')
      return
    }
    if (code.length !== 6) {
      setError('Enter the full 6-digit code.')
      return
    }
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, password }),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error ?? INVALID)
      setDone(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : INVALID)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address first.')
      return
    }
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })
      if (!response.ok) throw new Error('resend failed')
      setCode('')
      setCountdown(RESEND_SECONDS)
    } catch {
      setError('We couldn’t resend the code. Try again shortly.')
    }
  }

  return (
    <AuthShell
      eyebrow="Choose a new password"
      heading={done ? 'Password updated' : 'Reset your password'}
      footer={
        <>
          Need help? <Link to="/login">Back to login</Link>
        </>
      }
    >
      {done ? (
        <>
          <div className="auth-notice">
            <CheckCircle2 size={26} />
            <p>Your password has been changed. You can now log in with your new password.</p>
          </div>
          <Link className="btn btn--primary btn--block btn--large" to="/login">
            Go to login <ArrowRight size={18} />
          </Link>
        </>
      ) : (
        <>
          <p className="auth-card__intro">
            Enter the 6-digit code we emailed you and choose a new password.
          </p>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="field">
              <label htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
              />
            </div>

            <div className="field">
              <label htmlFor="reset-code">Reset code</label>
              <OtpInput id="reset-code" value={code} onChange={setCode} disabled={loading} error={error} />
            </div>

            <div className="field">
              <label htmlFor="new-password">New password</label>
              <div className="password-input">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-input__toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {error ? <p className="field-error">{error}</p> : null}

            <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
              {loading ? 'Updating…' : <>Set new password <ArrowRight size={18} /></>}
            </button>
          </form>

          <button className="resend-button" type="button" onClick={() => void handleResend()} disabled={countdown > 0}>
            <RefreshCw size={15} />
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </button>
        </>
      )}
    </AuthShell>
  )
}
