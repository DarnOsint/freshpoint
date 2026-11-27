import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { OtpInput } from '../components/OtpInput'
import { useSiteSettings } from '../lib/site-content'

const RESEND_SECONDS = 30

export function ResetPasswordPage() {
  const { settings } = useSiteSettings()
  const copy = settings.interface.reset
  const common = settings.interface.common
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
      setError(common.validEmail)
      return
    }
    if (code.length !== 6) {
      setError(common.fullCode)
      return
    }
    if (password.length < 8) {
      setError(common.passwordTooShort)
      return
    }
    if (password !== confirmPassword) {
      setError(common.passwordMismatch)
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
      if (!response.ok || !result.ok) throw new Error(result.error ?? copy.error)
      setDone(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(copy.enterEmailFirst)
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
      setError(copy.resendError)
    }
  }

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      heading={done ? copy.doneHeading : copy.heading}
      footer={<>{copy.needHelp} <Link to="/login">{common.backToLogin}</Link></>}
    >
      {done ? (
        <>
          <div className="auth-notice">
            <p>{copy.doneNotice}</p>
          </div>
          <Link className="btn btn--primary btn--block btn--large" to="/login">
            {copy.doneCta}
          </Link>
        </>
      ) : (
        <>
          <p className="auth-card__intro">{copy.intro}</p>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="field">
              <label htmlFor="reset-email">{common.emailLabel}</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder={common.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
              />
            </div>

            <div className="field">
              <label htmlFor="reset-code">{copy.codeLabel}</label>
              <OtpInput id="reset-code" value={code} onChange={setCode} disabled={loading} error={error} />
            </div>

            <div className="field">
              <label htmlFor="new-password">{copy.newPasswordLabel}</label>
              <div className="password-input">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={common.passwordPlaceholder}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <div className="field">
              <label htmlFor="confirm-password">{copy.confirmPasswordLabel}</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={copy.confirmPlaceholder}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {error ? <p className="field-error">{error}</p> : null}

            <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
              {loading ? copy.updating : copy.submit}
            </button>
          </form>

          <button className="resend-button" type="button" onClick={() => void handleResend()} disabled={countdown > 0}>
            {countdown > 0 ? copy.resendIn.replace('{seconds}', String(countdown)) : copy.resend}
          </button>
        </>
      )}
    </AuthShell>
  )
}
