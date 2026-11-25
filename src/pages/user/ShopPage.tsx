import { useMemo, useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import { ProductImage } from '../../components/ProductImage'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function ShopPage() {
  const { products, cart, setCartQuantity } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.shop
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  const visible = useMemo(() => products.filter((product) => product.active !== false && product.stock > 0), [products])
  const categoryOptions = ['All', ...Array.from(new Set(visible.map((product) => product.category)))]
  const activeCategory = categoryOptions.includes(category) ? category : 'All'
  const filtered = useMemo(() => visible.filter((product) => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory
    const matchesQuery = product.name.toLowerCase().includes(query.trim().toLowerCase())
    return matchesCategory && matchesQuery
  }), [visible, activeCategory, query])

  function increase(productId: string, quantity: number, stock: number) {
    if (quantity < stock) setCartQuantity(productId, quantity + 1)
  }

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.heading}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>

      <label className="search-field">
        <Search size={19} />
        <input type="search" placeholder={copy.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      <div className="filter-chips" role="group" aria-label={copy.filterLabel}>
        {categoryOptions.map((item) => (
          <button
            key={item}
            type="button"
            className={`filter-chip${activeCategory === item ? ' filter-chip--active' : ''}`}
            onClick={() => setCategory(item)}
          >
            {item === 'All' ? copy.all : item}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="shop-grid">
          {filtered.map((product) => {
            const quantity = cart.find((line) => line.productId === product.id)?.quantity ?? 0
            const atMax = quantity >= product.stock
            return (
              <article className="shop-card" key={product.id}>
                <button
                  className="shop-card__pick"
                  type="button"
                  onClick={() => increase(product.id, quantity, product.stock)}
                  disabled={atMax}
                  aria-label={copy.selectLabel.replace('{name}', product.name)}
                >
                  <div className={`shop-card__art shop-card__art--${product.tone}`} aria-hidden="true">
                    <ProductImage image={product.image} emoji={product.emoji} />
                    {product.stock <= 10 ? <em>{copy.lowStock}</em> : null}
                  </div>
                  <div className="shop-card__meta">
                    <h3>{product.name}</h3>
                    <small>{product.category} · {product.unit}</small>
                  </div>
                </button>
                <div className="shop-card__body">
                  <strong>{formatMoney(product.price)}</strong>
                  {quantity > 0 ? (
                    <div className="qty-control qty-control--card">
                      <button
                        type="button"
                        onClick={() => setCartQuantity(product.id, quantity - 1)}
                        aria-label={copy.decreaseLabel.replace('{name}', product.name)}
                      >
                        <Minus size={17} />
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => increase(product.id, quantity, product.stock)}
                        disabled={atMax}
                        aria-label={copy.increaseLabel.replace('{name}', product.name)}
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn--primary btn--block btn--small"
                      type="button"
                      onClick={() => setCartQuantity(product.id, 1)}
                    >
                      <Plus size={16} /> {copy.addToBasket}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h3>{copy.nothingFound}</h3>
          <p>{copy.nothingFoundHint}</p>
        </div>
      )}
    </div>
  )
}
