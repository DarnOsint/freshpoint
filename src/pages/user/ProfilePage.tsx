import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PhoneField } from '../../components/PhoneField'
import { SheetCloseButton } from '../../components/SheetCloseButton'
import { useAuth } from '../../lib/auth-context'
import { countries, defaultCountry, formatNationalNumber, isValidNationalNumber, toE164 } from '../../lib/countries'
import { useData } from '../../lib/data-store'
import { formatMoney, initials } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'
import { useSheetDismiss } from '../../lib/use-sheet-dismiss'
import { supabase } from '../../lib/supabase'

type ProfileModal = 'details' | 'password' | 'support' | null

function splitPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  const match = countries.find((item) => digits.startsWith(item.dial.slice(1))) ?? defaultCountry
  const dialDigits = match.dial.slice(1)
  const national = digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits
  return { code: match.code, national: formatNationalNumber(national) }
}

export function ProfilePage() {
  const { user, session, signOut } = useAuth()
  const { orders, trackEvent } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.profile
  const common = settings.interface.common
  const navigate = useNavigate()

  const fullName = (user?.user_metadata?.full_name as string | undefined) || common.customerFallback
  const username = (user?.user_metadata?.username as string | undefined) || common.notApplicable
  const email = user?.email || common.notApplicable
  const phone = user?.phone || common.notApplicable
  const savedAddress = String(user?.user_metadata?.address ?? '').trim()
  const paidOrders = orders.filter((order) => order.status !== 'Cancelled')
  const itemsOrdered = paidOrders.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0), 0)
  const amountPaid = paidOrders.reduce((total, order) => total + order.total, 0)

  const initialPhone = splitPhone(phone === common.notApplicable ? '' : phone)
  const [name, setName] = useState(fullName)
  const [handle, setHandle] = useState(username === common.notApplicable ? '' : username)
  const [countryCode, setCountryCode] = useState(initialPhone.code)
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.national)
  const [address, setAddress] = useState(savedAddress)
  const [addressError, setAddressError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [detailsSaved, setDetailsSaved] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [modal, setModal] = useState<ProfileModal>(null)

  const modalTitle = modal === 'details'
    ? copy.accountDetails
    : modal === 'password'
      ? copy.passwordTitle
      : modal === 'support'
        ? copy.contactSupport
        : ''
  const whatsappNumber = settings.contact.whatsapp || settings.contact.phone || ''
  const whatsappDigits = whatsappNumber.replace(/\D/g, '')
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : ''

  function closeModal() {
    setModal(null)
  }

  function trackSupport(channel: string) {
    trackEvent({ action: 'support.contact', targetType: 'support', targetId: channel })
  }

  useSheetDismiss(modal !== null, closeModal)

  function openModal(next: Exclude<ProfileModal, null>) {
    if (next === 'details') {
      const currentPhone = splitPhone(user?.phone ?? '')
      setName(fullName)
      setHandle(username === common.notApplicable ? '' : username)
      setCountryCode(currentPhone.code)
      setPhoneNumber(currentPhone.national)
      setAddress(savedAddress)
      setAddressError('')
      setPhoneError('')
      setDetailsError('')
      setDetailsSaved('')
    }
    if (next === 'password') {
      setPassword('')
      setConfirmPassword('')
      setPasswordError('')
      setPasswordSuccess('')
    }
    setModal(next)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleDetails(event: FormEvent) {
    event.preventDefault()
    setDetailsError('')
    setDetailsSaved('')
    setAddressError('')
    setPhoneError('')
    const nextName = name.trim()
    const nextHandle = handle.trim().toLowerCase()
    const nextAddress = address.trim()
    if (nextName.length < 2) { setDetailsError(copy.detailsError); return }
    if (!/^[a-z0-9_]{3,20}$/.test(nextHandle)) { setDetailsError(copy.usernameError); return }

    const country = countries.find((item) => item.code === countryCode) ?? defaultCountry
    if (phoneNumber.trim() && !isValidNationalNumber(phoneNumber, country.dial)) { setPhoneError(common.validPhone); return }
    if (nextAddress && nextAddress.length < 5) { setAddressError(copy.addressError); return }

    const fullPhone = phoneNumber.trim() ? toE164(country.dial, phoneNumber) : ''
    setSavingDetails(true)
    try {
      const token = session?.access_token
      const response = await fetch('/api/customers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fullName: nextName, username: nextHandle, phone: fullPhone, address: nextAddress }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || copy.detailsError)
      await supabase.auth.refreshSession()
      setName(nextName)
      setHandle(nextHandle)
      setAddress(nextAddress)
      setDetailsSaved(copy.detailsSaved)
      trackEvent({
        action: 'profile.update',
        targetType: 'profile',
        targetId: user?.id ?? '',
        details: { phone: Boolean(fullPhone), address: Boolean(nextAddress) },
      })
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
    <div className="app-page app-page--profile">
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

      <div className="link-list profile-links">
        <button className="link-row" type="button" onClick={() => openModal('details')}>
          <span>{copy.accountDetails}<small>{copy.readOnlyHint}</small></span>
          <span className="link-row__chevron" aria-hidden="true">›</span>
        </button>
        <button className="link-row" type="button" onClick={() => openModal('password')}>
          <span>{copy.passwordTitle}<small>{copy.passwordHint}</small></span>
          <span className="link-row__chevron" aria-hidden="true">›</span>
        </button>
        <Link to="/app/orders" className="link-row">
          <span>{copy.myOrders}<small>{copy.myOrdersHint}</small></span>
          <span className="link-row__chevron" aria-hidden="true">›</span>
        </Link>
        <button className="link-row" type="button" onClick={() => openModal('support')}>
          <span>{copy.contactSupport}<small>{copy.contactSupportHint}</small></span>
          <span className="link-row__chevron" aria-hidden="true">›</span>
        </button>
      </div>

      <button className="btn btn--outline btn--block btn--large" type="button" onClick={() => void handleSignOut()}>
        {copy.signOut}
      </button>

      {modal ? (
        <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal() }}>
          <div className="profile-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-sheet-title">
            <div className="profile-sheet__head">
              <div>
                <p className="eyebrow">{copy.eyebrow}</p>
                <h2 id="profile-sheet-title">{modalTitle}</h2>
              </div>
              <SheetCloseButton label={`Close ${modalTitle}`} onClick={closeModal} />
            </div>

            {modal === 'details' ? (
              <form className="profile-form" onSubmit={(event) => void handleDetails(event)} noValidate>
                <div className="field">
                  <label htmlFor="profileName">{copy.fullNameLabel}</label>
                  <input id="profileName" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" autoFocus />
                </div>
                <div className="field">
                  <label htmlFor="profileUsername">{copy.username}</label>
                  <input id="profileUsername" value={handle} onChange={(event) => setHandle(event.target.value)} autoComplete="username" />
                </div>
                <div className="profile-readonly">
                  <span>{copy.emailLabel}</span>
                  <strong>{email}</strong>
                </div>
                <PhoneField
                  id="profilePhone"
                  countryCode={countryCode}
                  onCountryChange={setCountryCode}
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  error={phoneError}
                  optional
                />
                <div className="field">
                  <label htmlFor="profileAddress">{copy.addressLabel} <small>{copy.addressOptional}</small></label>
                  <input
                    id="profileAddress"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder={copy.addressPlaceholder}
                    autoComplete="street-address"
                    aria-invalid={Boolean(addressError)}
                  />
                  {addressError ? <p className="field-error">{addressError}</p> : null}
                </div>
                {detailsError ? <p className="field-error">{detailsError}</p> : null}
                {detailsSaved ? <p className="profile-success">{detailsSaved}</p> : null}
                <button className="btn btn--primary btn--block btn--large" type="submit" disabled={savingDetails}>
                  {savingDetails ? copy.savingDetails : copy.saveDetails}
                </button>
              </form>
            ) : null}

            {modal === 'password' ? (
              <form className="profile-form" onSubmit={(event) => void handlePassword(event)} noValidate>
                <div className="field">
                  <label htmlFor="newPassword">{copy.newPassword}</label>
                  <input id="newPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" autoFocus />
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
            ) : null}

            {modal === 'support' ? (
              <div className="profile-support">
                <p className="section-hint">{copy.contactSupportHint}</p>
                {whatsappUrl ? (
                  <div className="profile-readonly">
                    <span>WhatsApp</span>
                    <strong><a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackSupport('whatsapp')}>{whatsappNumber}</a></strong>
                  </div>
                ) : null}
                <div className="profile-readonly">
                  <span>{copy.emailLabel}</span>
                  <strong><a href={`mailto:${settings.contact.email}`} onClick={() => trackSupport('email')}>{settings.contact.email}</a></strong>
                </div>
                <p className="profile-support__detail">{settings.contact.location}</p>
                <p className="profile-support__detail">{settings.contact.hours}</p>
                {whatsappUrl ? (
                  <a className="btn btn--primary btn--block btn--large" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackSupport('whatsapp')}>Chat on WhatsApp</a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
