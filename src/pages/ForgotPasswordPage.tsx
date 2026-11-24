import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MailCheck } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'

const REQUEST_ERROR = 'We couldn’t send the reset email. Check the address and try again.'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.')
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
      if (!response.ok || !result.ok) throw new Error(result.error ?? REQUEST_ERROR)
      setSent(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : REQUEST_ERROR)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      heading={sent ? 'Check your email' : 'Forgot your password?'}
      footer={
        <>
          Remembered it? <Link to="/login">Back to login</Link>
        </>
      }
    >
      {sent ? (
        <>
          <div className="auth-notice">
            <MailCheck size={26} />
            <p>
              If an account exists for <strong>{email.trim().toLowerCase()}</strong>, we’ve sent a 6-digit reset
              code. It expires in 10 minutes.
            </p>
          </div>
          <Link
            className="btn btn--primary btn--block btn--large"
            to={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`}
          >
            Enter reset code <ArrowRight size={18} />
          </Link>
          <p className="auth-card__intro auth-card__intro--tight">
            Didn’t get it? Check your spam folder, or go back and try again with the same address.
          </p>
        </>
      ) : (
        <>
          <p className="auth-card__intro">
            Enter the email you use with FreshPoint. We’ll send a reset code to your inbox — no phone or username
            needed.
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
              {error ? <p className="field-error">{error}</p> : null}
            </div>
            <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
              {loading ? 'Sending…' : <>Send reset code <ArrowRight size={18} /></>}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
