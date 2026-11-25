import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { AuthShell } from '../../components/AuthShell'
import { useAuth } from '../../lib/auth-context'
import { useSiteSettings } from '../../lib/site-content'
import { supabase } from '../../lib/supabase'
import { isAdmin } from '../../lib/roles'

type Method = 'email' | 'username'
type UsernameLookup = { identifier: string; kind: 'phone' | 'email' }

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { settings } = useSiteSettings()
  const copy = settings.interface.adminLogin
  const common = settings.interface.common
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
      setError(copy.enterDetails)
      return
    }
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(common.validEmail)
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
      setError(copy.error)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/admin', { replace: true })
  }

  const methods: Array<{ value: Method; label: string }> = [
    { value: 'email', label: copy.emailMethod },
    { value: 'username', label: copy.usernameMethod },
  ]

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      heading={copy.heading}
      footer={<>{copy.footer} <Link to="/login">{copy.goToLogin}</Link></>}
    >
      <p className="auth-card__intro"><LockKeyhole size={15} /> {copy.intro}</p>

      <div className="login-methods" role="tablist" aria-label={copy.methodLabel}>
        {methods.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={method === item.value}
            className={`login-method${method === item.value ? ' login-method--active' : ''}`}
            onClick={() => { setMethod(item.value); setError('') }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="field">
          <label htmlFor="adminIdentifier">{method === 'email' ? common.emailLabel : common.usernameLabel}</label>
          <input
            id="adminIdentifier"
            type={method === 'email' ? 'email' : 'text'}
            autoComplete={method === 'email' ? 'email' : 'username'}
            placeholder={method === 'email' ? common.emailPlaceholder : common.usernamePlaceholder}
            value={method === 'email' ? email : username}
            onChange={(event) => (method === 'email' ? setEmail(event.target.value) : setUsername(event.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="adminPassword">{common.passwordLabel}</label>
          <div className="password-input">
            <input
              id="adminPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={common.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" className="password-input__toggle" onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? common.hidePassword : common.showPassword}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div className="auth-link-row"><Link to="/forgot-password">{common.forgotPassword}</Link></div>
        {error ? <p className="field-error">{error}</p> : null}
        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={loading}>
          {loading ? copy.signingIn : <>{copy.submit} <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthShell>
  )
}
