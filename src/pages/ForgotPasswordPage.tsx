import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { useSiteSettings } from '../lib/site-content'

export function ForgotPasswordPage() {
  const { settings } = useSiteSettings()
  const copy = settings.interface.forgot
  const common = settings.interface.common
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(common.validEmail)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error ?? copy.error)
      setSent(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      heading={sent ? copy.sentHeading : copy.heading}
      footer={<>{copy.remembered} <Link to="/login">{common.backToLogin}</Link></>}
    >
      {sent ? (
        <>
          <div className="auth-notice">
            <p>{copy.notice.replace('{email}', email.trim().toLowerCase())}</p>
          </div>
          <Link
            className="btn btn--primary btn--block btn--large"
            to={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`}
          >
            {copy.submitCode}
          </Link>
          <p className="auth-card__intro auth-card__intro--tight">{copy.noEmailHint}</p>
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
              {error ? <p className="field-error">{error}</p> : null}
            </div>
            <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
              {loading ? copy.sending : copy.send}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
