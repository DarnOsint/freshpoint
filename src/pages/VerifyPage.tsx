import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { OtpInput } from '../components/OtpInput'
import { homePathForUser } from '../lib/roles'
import { useSiteSettings } from '../lib/site-content'
import { supabase } from '../lib/supabase'
import type { VerifyState } from '../lib/auth-context'

const RESEND_SECONDS = 30

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}••••${name.slice(-1)}@${domain}`
}

export function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { settings } = useSiteSettings()
  const copy = settings.interface.verify
  const common = settings.interface.common
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
      setError(common.fullCode)
      return
    }
    if (!flow) return

    const password = flow.password || fallbackPassword.trim()
    if (!password) {
      setError(copy.enterPassword)
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
        throw new Error(result.error ?? copy.codeError)
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      })
      if (sessionError) throw sessionError
      navigate(homePathForUser(sessionData.user), { replace: true })
    } catch {
      setError(copy.codeError)
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
      setError(copy.resendError)
    }
  }

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      heading={copy.heading}
      footer={<>{copy.wrongAddress} <Link to="/signup">{copy.differentEmail}</Link></>}
    >
      <p className="auth-card__intro">
        {copy.intro} <strong>{maskEmail(flow.email)}</strong>. {copy.introSuffix}
      </p>

      <form onSubmit={handleVerify} className="auth-form">
        <div className="field">
          <label htmlFor="otp">{copy.codeLabel}</label>
          <OtpInput id="otp" value={code} onChange={setCode} disabled={loading} error={error} />
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        {!flow.password ? (
          <div className="field">
            <label htmlFor="verify-password">{copy.fallbackPasswordLabel}</label>
            <input id="verify-password" type="password" autoComplete="current-password"
              placeholder={copy.fallbackPlaceholder} value={fallbackPassword}
              onChange={(event) => setFallbackPassword(event.target.value)} />
          </div>
        ) : null}

        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? copy.verifying : copy.submit}
        </button>
      </form>

      <button className="resend-button" type="button" onClick={() => void handleResend()} disabled={countdown > 0}>
        {countdown > 0 ? copy.resendIn.replace('{seconds}', String(countdown)) : copy.resend}
      </button>
    </AuthShell>
  )
}
