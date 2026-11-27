import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { formatMoney, initials } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'
import { supabase } from '../../lib/supabase'

export function ProfilePage() {
  const { user, session, signOut } = useAuth()
  const { orders } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.profile
  const common = settings.interface.common
  const navigate = useNavigate()

  const fullName = (user?.user_metadata?.full_name as string | undefined) || common.customerFallback
  const username = (user?.user_metadata?.username as string | undefined) || common.notApplicable
  const email = user?.email || common.notApplicable
  const phone = user?.phone || common.notApplicable
  const paidOrders = orders.filter((order) => order.status !== 'Cancelled')
  const itemsOrdered = paidOrders.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0), 0)
  const amountPaid = paidOrders.reduce((total, order) => total + order.total, 0)

  const [name, setName] = useState(fullName)
  const [handle, setHandle] = useState(username === common.notApplicable ? '' : username)
  const [detailsError, setDetailsError] = useState('')
  const [detailsSaved, setDetailsSaved] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleDetails(event: FormEvent) {
    event.preventDefault()
    setDetailsError('')
    setDetailsSaved('')
    const nextName = name.trim()
    const nextHandle = handle.trim().toLowerCase()
    if (nextName.length < 2) { setDetailsError(copy.detailsError); return }
    if (!/^[a-z0-9_]{3,20}$/.test(nextHandle)) { setDetailsError(copy.usernameError); return }

    setSavingDetails(true)
    try {
      const token = session?.access_token
      const response = await fetch('/api/customers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fullName: nextName, username: nextHandle }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || copy.detailsError)
      await supabase.auth.refreshSession()
      setName(nextName)
      setHandle(nextHandle)
      setDetailsSaved(copy.detailsSaved)
    } catch (caught) {
      setDetailsError(caught instanceof Error ? caught.message : copy.detailsError)
    } finally {
      setSavingDetails(false)
    }
  }

  async function handlePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (password.length < 8) { setPasswordError(copy.passwordMin); return }
    if (password !== confirmPassword) { setPasswordError(copy.passwordMismatch); return }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPassword('')
      setConfirmPassword('')
      setPasswordSuccess(copy.passwordSuccess)
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : copy.passwordError)
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.heading}</h1></div>
      </header>

      <section className="profile-hero">
        <span className="profile-avatar">{initials(fullName)}</span>
        <div><h2>{fullName}</h2><p>@{username}</p></div>
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>{copy.summaryTitle}</h2></div>
        <div className="stat-grid profile-stats">
          <div className="stat-card">
            <strong>{orders.length}</strong>
            <small>{copy.ordersPlaced}</small>
          </div>
          <div className="stat-card">
            <strong>{itemsOrdered}</strong>
            <small>{copy.itemsOrdered}</small>
          </div>
          <div className="stat-card">
            <strong>{formatMoney(amountPaid)}</strong>
            <small>{copy.amountPaid}</small>
          </div>
        </div>
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>{copy.accountDetails}</h2></div>
        <p className="section-hint">{copy.readOnlyHint}</p>
        <form className="profile-form" onSubmit={(event) => void handleDetails(event)} noValidate>
          <div className="field">
            <label htmlFor="profileName">{copy.fullNameLabel}</label>
            <input id="profileName" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="profileUsername">{copy.username}</label>
            <input id="profileUsername" value={handle} onChange={(event) => setHandle(event.target.value)} autoComplete="username" />
          </div>
          <div className="profile-readonly">
            <span>{copy.emailLabel}</span>
            <strong>{email}</strong>
          </div>
          <div className="profile-readonly">
            <span>{copy.phoneLabel}</span>
            <strong>{phone}</strong>
          </div>
          {detailsError ? <p className="field-error">{detailsError}</p> : null}
          {detailsSaved ? <p className="profile-success">{detailsSaved}</p> : null}
          <button className="btn btn--primary btn--block btn--large" type="submit" disabled={savingDetails}>
            {savingDetails ? copy.savingDetails : copy.saveDetails}
          </button>
        </form>
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>{copy.passwordTitle}</h2></div>
        <p className="section-hint">{copy.passwordHint}</p>
        <form className="profile-form" onSubmit={(event) => void handlePassword(event)} noValidate>
          <div className="field">
            <label htmlFor="newPassword">{copy.newPassword}</label>
            <input id="newPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">{copy.confirmPassword}</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
          </div>
          {passwordError ? <p className="field-error">{passwordError}</p> : null}
          {passwordSuccess ? <p className="profile-success">{passwordSuccess}</p> : null}
          <button className="btn btn--outline btn--block btn--large" type="submit" disabled={changingPassword}>
            {changingPassword ? copy.changingPassword : copy.changePassword}
          </button>
        </form>
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>{copy.more}</h2></div>
        <div className="link-list">
          <Link to="/app/orders" className="link-row"><span>{copy.myOrders} <small>{copy.myOrdersHint}</small></span></Link>
          <Link to="/#contact" className="link-row"><span>{copy.contactSupport} <small>{copy.contactSupportHint}</small></span></Link>
        </div>
      </section>

      <button className="btn btn--outline btn--block btn--large" type="button" onClick={() => void handleSignOut()}>
        {copy.signOut}
      </button>
    </div>
  )
}
