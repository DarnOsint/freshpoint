import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { ProductImage } from '../../components/ProductImage'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function CartPage() {
  const { user } = useAuth()
  const { cart, products, cartTotal, setCartQuantity, placeOrder } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.cart
  const navigate = useNavigate()
  const [name, setName] = useState((user?.user_metadata?.full_name as string | undefined) ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
          <ShoppingBasket size={30} />
          <h3>{copy.emptyHeading}</h3>
          <p>{copy.emptyBody}</p>
          <Link to="/app/shop" className="btn btn--primary btn--small">{copy.browseProduce}</Link>
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
            <ProductImage image={product.image} emoji={product.emoji} className={`cart-line__art cart-line__art--${product.tone}`} />
            <div className="cart-line__info">
              <strong>{product.name}</strong>
              <small>{formatMoney(product.price)} · {product.unit}</small>
              <div className="qty-control">
                <button type="button" onClick={() => setCartQuantity(product.id, quantity - 1)} aria-label={copy.removeOne.replace('{name}', product.name)}><Minus size={16} /></button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setCartQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock} aria-label={copy.addOne.replace('{name}', product.name)}><Plus size={16} /></button>
              </div>
            </div>
            <div className="cart-line__right">
              <strong>{formatMoney(product.price * quantity)}</strong>
              <button type="button" className="cart-line__remove" onClick={() => setCartQuantity(product.id, 0)} aria-label={copy.remove.replace('{name}', product.name)}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>

      <form className="checkout-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <h2>{copy.deliveryTitle}</h2>
        <div className="checkout-form__grid">
          <div className="field">
            <label htmlFor="deliveryName">{copy.nameLabel}</label>
            <input id="deliveryName" value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="deliveryPhone">{copy.phoneLabel}</label>
            <input id="deliveryPhone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={copy.phonePlaceholder} inputMode="tel" autoComplete="tel" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="deliveryAddress">{copy.addressLabel}</label>
          <input id="deliveryAddress" value={address} onChange={(event) => setAddress(event.target.value)} placeholder={copy.addressPlaceholder} autoComplete="street-address" />
        </div>
        {error ? <p className="field-error">{error}</p> : null}
        <div className="checkout-summary">
          <span>{copy.total}</span>
          <strong>{formatMoney(cartTotal)}</strong>
        </div>
        <button className="btn btn--primary btn--block btn--large" type="submit" disabled={busy}>
          {busy ? 'Placing order…' : copy.placeOrder} <ArrowRight size={18} />
        </button>
        <p className="checkout-note">{copy.note}</p>
      </form>
    </div>
  )
}
