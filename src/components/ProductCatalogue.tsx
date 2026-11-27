import { useEffect, useMemo, useState } from 'react'
import { ProductImage } from './ProductImage'
import { useData } from '../lib/data-store'
import { formatMoney } from '../lib/format'
import { useSiteSettings } from '../lib/site-content'

export function ProductCatalogue() {
  const { products, cart, setCartQuantity, trackEvent } = useData()
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

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return
    const timer = window.setTimeout(() => {
      trackEvent({
        action: 'catalogue.search',
        targetType: 'search',
        targetId: term.slice(0, 120),
        details: { results: filtered.length, category: activeCategory },
      })
    }, 700)
    return () => window.clearTimeout(timer)
  }, [query, filtered.length, activeCategory, trackEvent])

  function increase(productId: string, quantity: number, stock: number, name: string) {
    if (quantity >= stock) return
    setCartQuantity(productId, quantity + 1)
    trackEvent({
      action: quantity > 0 ? 'catalogue.increase' : 'catalogue.add',
      targetType: 'product',
      targetId: productId,
      details: { name, quantity: quantity + 1 },
    })
  }

  return (
    <>
      <label className="search-field">
        <input
          type="search"
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={copy.searchPlaceholder}
        />
      </label>

      <div className="filter-chips" role="group" aria-label={copy.filterLabel}>
        {categoryOptions.map((item) => (
          <button
            key={item}
            type="button"
            className={`filter-chip${activeCategory === item ? ' filter-chip--active' : ''}`}
            onClick={() => {
              setCategory(item)
              trackEvent({ action: 'catalogue.filter', targetType: 'filter', targetId: item, details: { from: activeCategory } })
            }}
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
              <article className={`shop-card${quantity > 0 ? ' shop-card--in-cart' : ''}`} key={product.id}>
                <button
                  className="shop-card__pick"
                  type="button"
                  onClick={() => increase(product.id, quantity, product.stock, product.name)}
                  disabled={atMax}
                  aria-label={copy.selectLabel.replace('{name}', product.name)}
                >
                  <div className={`shop-card__art shop-card__art--${product.tone}`} aria-hidden="true">
                    <ProductImage image={product.image} />
                    {product.stock <= 10 ? <em>{copy.lowStock}</em> : null}
                  </div>
                  <div className="shop-card__meta">
                    <h3>{product.name}</h3>
                    <small>{product.category} · {product.unit}</small>
                    <strong>{formatMoney(product.price)}</strong>
                  </div>
                </button>
                <div className="shop-card__body">
                  {quantity > 0 ? (
                    <div className="qty-control qty-control--card">
                      <button
                        type="button"
                        onClick={() => {
                          setCartQuantity(product.id, quantity - 1)
                          trackEvent({
                            action: 'catalogue.decrease',
                            targetType: 'product',
                            targetId: product.id,
                            details: { name: product.name, quantity: quantity - 1 },
                          })
                        }}
                        aria-label={copy.decreaseLabel.replace('{name}', product.name)}
                      >
                        -
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => increase(product.id, quantity, product.stock, product.name)}
                        disabled={atMax}
                        aria-label={copy.increaseLabel.replace('{name}', product.name)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn--primary btn--block btn--small"
                      type="button"
                      onClick={() => {
                        setCartQuantity(product.id, 1)
                        trackEvent({
                          action: 'catalogue.add',
                          targetType: 'product',
                          targetId: product.id,
                          details: { name: product.name, quantity: 1 },
                        })
                      }}
                      aria-label={`${copy.addToBasket}: ${product.name}`}
                    >
                      {copy.addToBasket}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h3>{copy.nothingFound}</h3>
          <p>{copy.nothingFoundHint}</p>
        </div>
      )}
    </>
  )
}
