import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { AuthShell } from '../../components/AuthShell'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { isAdmin } from '../../lib/roles'

type Method = 'email' | 'username'
type UsernameLookup = { identifier: string; kind: 'phone' | 'email' }

const ADMIN_ERROR = 'We couldn’t sign you in to the admin console. Check your details and try again.'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [method, setMethod] = useState<Method>('email')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user && isAdmin(user)) return <Navigate to="/admin" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const value = (method === 'email' ? email : username).trim()

    if (!value || !password) {
      setError('Enter your details and password.')
      return
    }
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      let identifier = value
      let usePhone = false
      if (method === 'username') {
        const { data, error: lookupError } = await supabase.rpc('login_identifier_for_username', { p_username: value })
        if (lookupError) throw lookupError
        const match = (data as UsernameLookup[] | null)?.[0]
        if (!match) throw new Error('No login found')
        identifier = match.identifier
        usePhone = match.kind === 'phone'
      }

      const { data, error: authError } = usePhone
        ? await supabase.auth.signInWithPassword({ phone: identifier, password })
        : await supabase.auth.signInWithPassword({ email: identifier, password })
      if (authError || !data.user || !isAdmin(data.user)) {
        await supabase.auth.signOut()
        throw new Error('Not an admin')
      }
    } catch {
      setError(ADMIN_ERROR)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/admin', { replace: true })
  }

  return (
    <AuthShell
      eyebrow="Staff access"
      heading="Admin console"
      footer={<>Need the customer app? <Link to="/login">Go to login</Link></>}
    >
      <p className="auth-card__intro"><LockKeyhole size={15} /> Sign in with an authorised FreshPoint admin account.</p>

      <div className="login-methods" role="tablist" aria-label="Choose an admin login method">
        <button type="button" role="tab" aria-selected={method === 'email'}
          className={`login-method${method === 'email' ? ' login-method--active' : ''}`}
          onClick={() => { setMethod('email'); setError('') }}>Email</button>
        <button type="button" role="tab" aria-selected={method === 'username'}
          className={`login-method${method === 'username' ? ' login-method--active' : ''}`}
          onClick={() => { setMethod('username'); setError('') }}>Username</button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field">
          <label htmlFor="adminIdentifier">{method === 'email' ? 'Email address' : 'Username'}</label>
          <input
            id="adminIdentifier"
            type={method === 'email' ? 'email' : 'text'}
            autoComplete={method === 'email' ? 'email' : 'username'}
            placeholder={method === 'email' ? 'admin@freshpoint.ss' : 'admin.username'}
            value={method === 'email' ? email : username}
            onChange={(event) => (method === 'email' ? setEmail(event.target.value) : setUsername(event.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="adminPassword">Password</label>
          <div className="password-input">
            <input
              id="adminPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" className="password-input__toggle" onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div className="auth-link-row"><Link to="/forgot-password">Forgot password?</Link></div>
        {error ? <p className="field-error">{error}</p> : null}
        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : <>Sign in to console <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthShell>
  )
}
