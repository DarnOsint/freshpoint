import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductImage } from '../../components/ProductImage'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function CartPage() {
  const { user, session } = useAuth()
  const { cart, products, cartTotal, setCartQuantity, placeOrder, trackEvent } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.cart
  const navigate = useNavigate()

  const [saved, setSaved] = useState({
    phone: String(user?.user_metadata?.phone || user?.phone || ''),
    address: String(user?.user_metadata?.address ?? '').trim(),
  })
  const [name, setName] = useState((user?.user_metadata?.full_name as string | undefined) ?? '')
  const [phone, setPhone] = useState(saved.phone)
  const [address, setAddress] = useState(saved.address)
  const [useSaved, setUseSaved] = useState(Boolean(saved.address))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    fetch('/api/customers?view=me', { headers, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((me) => {
        if (!active || !me) return
        const next = { phone: String(me.phone ?? ''), address: String(me.address ?? '').trim() }
        setSaved(next)
        setPhone(next.phone)
        setAddress(next.address)
        if (me.fullName) setName(String(me.fullName))
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [session?.access_token])

  const cartItemsRef = useRef(cart.reduce((sum, line) => sum + line.quantity, 0))
  useEffect(() => {
    trackEvent({
      action: 'cart.open',
      targetType: 'cart',
      targetId: 'basket',
      details: { items: cartItemsRef.current },
    })
  }, [trackEvent])

  function toggleSaved(next: boolean) {
    setUseSaved(next)
    if (next) {
      setPhone(saved.phone)
      setAddress(saved.address)
    }
  }

  const lines = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId)
    return product ? [{ ...line, product }] : []
  })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (busy || !lines.length) return
    if (name.trim().length < 2) { setError(copy.nameError); return }
    if (phone.trim().length < 9) { setError(copy.phoneError); return }
    if (address.trim().length < 5) { setError(copy.addressError); return }

    trackEvent({
      action: 'checkout.start',
      targetType: 'checkout',
      targetId: 'basket',
      details: {
        items: lines.reduce((sum, line) => sum + line.quantity, 0),
        value: cartTotal,
        addressMode: useSaved ? 'saved' : 'custom',
      },
    })
    setBusy(true)
    try {
      await placeOrder({ customer: name.trim(), phone: phone.trim(), address: address.trim() })
      navigate('/app/orders')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not place your order. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!lines.length) {
    return (
      <div className="app-page">
        <header className="app-page__head">
          <div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.heading}</h1></div>
        </header>
        <div className="empty-state">
          <h3>{copy.emptyHeading}</h3>
          <p>{copy.emptyBody}</p>
          <Link to="/app" className="btn btn--primary btn--small">{copy.browseProduce}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.heading}</h1><p>{copy.intro}</p></div>
      </header>

      <div className="cart-list">
        {lines.map(({ product, quantity }) => (
          <article className="cart-line" key={product.id}>
            <ProductImage image={product.image} className={`cart-line__art cart-line__art--${product.tone}`} />
            <div className="cart-line__info">
              <strong>{product.name}</strong>
              <small>{formatMoney(product.price)} · {product.unit}</small>
              <div className="qty-control">
                <button type="button" onClick={() => setCartQuantity(product.id, quantity - 1)} aria-label={copy.removeOne.replace('{name}', product.name)}>-</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setCartQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock} aria-label={copy.addOne.replace('{name}', product.name)}>+</button>
              </div>
            </div>
            <div className="cart-line__right">
              <strong>{formatMoney(product.price * quantity)}</strong>
              <button type="button" className="cart-line__remove" onClick={() => setCartQuantity(product.id, 0)} aria-label={copy.remove.replace('{name}', product.name)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>

      <form className="checkout-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <h2>{copy.deliveryTitle}</h2>
        {saved.address ? (
          <label className="checkout-saved">
            <input type="checkbox" checked={useSaved} onChange={(event) => toggleSaved(event.target.checked)} />
            <span>
              <strong>{copy.useVerifiedAddress}</strong>
              <small>{saved.phone} · {saved.address}</small>
            </span>
          </label>
        ) : (
          <p className="checkout-saved-hint">{copy.addAddressHint} <Link to="/app/account">{copy.updateProfile}</Link></p>
        )}
        <div className="checkout-form__grid">
          <div className="field">
            <label htmlFor="deliveryName">{copy.nameLabel}</label>
            <input id="deliveryName" value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="deliveryPhone">{copy.phoneLabel}</label>
            <input id="deliveryPhone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={copy.phonePlaceholder} inputMode="tel" autoComplete="tel" disabled={useSaved} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="deliveryAddress">{copy.addressLabel}</label>
          <input id="deliveryAddress" value={address} onChange={(event) => setAddress(event.target.value)} placeholder={copy.addressPlaceholder} autoComplete="street-address" disabled={useSaved} />
        </div>
        {error ? <p className="field-error">{error}</p> : null}
        <div className="checkout-summary">
          <span>{copy.total}</span>
          <strong>{formatMoney(cartTotal)}</strong>
        </div>
        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={busy}>
          {busy ? 'Placing order…' : copy.placeOrder}
        </button>
        <p className="checkout-note">{copy.note}</p>
      </form>
    </div>
  )
}
