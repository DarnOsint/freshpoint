import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'

export function CartPage() {
  const { user } = useAuth()
  const { cart, products, cartTotal, setCartQuantity, placeOrder } = useData()
  const navigate = useNavigate()
  const [name, setName] = useState((user?.user_metadata?.full_name as string | undefined) ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  const lines = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId)
    return product ? [{ ...line, product }] : []
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!lines.length) return
    if (name.trim().length < 2) { setError('Enter your name.'); return }
    if (phone.trim().length < 9) { setError('Enter a valid phone number.'); return }
    if (address.trim().length < 5) { setError('Enter your delivery address.'); return }
    placeOrder({ customer: name.trim(), phone: phone.trim(), address: address.trim() })
    navigate('/app/orders')
  }

  if (!lines.length) {
    return (
      <div className="app-page">
        <header className="app-page__head">
          <div><p className="eyebrow">Your basket</p><h1>Basket</h1></div>
        </header>
        <div className="empty-state">
          <ShoppingBasket size={30} />
          <h3>Your basket is empty</h3>
          <p>Add some fresh produce to get started.</p>
          <Link to="/app/shop" className="btn btn--primary btn--small">Browse produce</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div><p className="eyebrow">Your basket</p><h1>Basket</h1><p>Review your items and add a delivery address.</p></div>
      </header>

      <div className="cart-list">
        {lines.map(({ product, quantity }) => (
          <article className="cart-line" key={product.id}>
            <span className={`cart-line__art cart-line__art--${product.tone}`} aria-hidden="true">{product.emoji}</span>
            <div className="cart-line__info">
              <strong>{product.name}</strong>
              <small>{formatMoney(product.price)} · {product.unit}</small>
              <div className="qty-control">
                <button type="button" onClick={() => setCartQuantity(product.id, quantity - 1)} aria-label={`Remove one ${product.name}`}><Minus size={16} /></button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setCartQuantity(product.id, quantity + 1)} aria-label={`Add one ${product.name}`}><Plus size={16} /></button>
              </div>
            </div>
            <div className="cart-line__right">
              <strong>{formatMoney(product.price * quantity)}</strong>
              <button type="button" className="cart-line__remove" onClick={() => setCartQuantity(product.id, 0)} aria-label={`Remove ${product.name}`}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>

      <form className="checkout-form" onSubmit={handleSubmit} noValidate>
        <h2>Delivery details</h2>
        <div className="checkout-form__grid">
          <div className="field">
            <label htmlFor="deliveryName">Full name</label>
            <input id="deliveryName" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="deliveryPhone">Phone number</label>
            <input id="deliveryPhone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+211900123456" inputMode="tel" autoComplete="tel" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="deliveryAddress">Delivery address</label>
          <input id="deliveryAddress" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Area, street or landmark in Juba" autoComplete="street-address" />
        </div>
        {error ? <p className="field-error">{error}</p> : null}
        <div className="checkout-summary">
          <span>Total</span>
          <strong>{formatMoney(cartTotal)}</strong>
        </div>
        <button className="btn btn--primary btn--block btn--large" type="submit">
          Place order <ArrowRight size={18} />
        </button>
        <p className="checkout-note">Our team will confirm your order and delivery time by phone.</p>
      </form>
    </div>
  )
}
