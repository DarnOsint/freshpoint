import { useMemo, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { ProductImage } from '../../components/ProductImage'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function ShopPage() {
  const { products, cart, addToCart } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.shop
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [added, setAdded] = useState('')

  const categoryOptions = ['All', ...Array.from(new Set(products.map((product) => product.category)))]
  const filtered = useMemo(() => products.filter((product) => {
    if (product.active === false) return false
    const matchesCategory = category === 'All' || product.category === category
    const matchesQuery = product.name.toLowerCase().includes(query.trim().toLowerCase())
    return matchesCategory && matchesQuery
  }), [products, category, query])

  function handleAdd(id: string) {
    addToCart(id)
    setAdded(id)
    window.setTimeout(() => setAdded((current) => (current === id ? '' : current)), 900)
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
            className={`filter-chip${category === item ? ' filter-chip--active' : ''}`}
            onClick={() => setCategory(item)}
          >
            {item === 'All' ? copy.all : item}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="shop-grid">
          {filtered.map((product) => {
            const inCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0
            return (
              <article className="shop-card" key={product.id}>
                <div className={`shop-card__art shop-card__art--${product.tone}`} aria-hidden="true">
                  <ProductImage image={product.image} emoji={product.emoji} />
                  {product.stock <= 10 ? <em>{copy.lowStock}</em> : null}
                </div>
                <div className="shop-card__body">
                  <h3>{product.name}</h3>
                  <small>{product.category} · {product.unit}</small>
                  <strong>{formatMoney(product.price)}</strong>
                  <button
                    className={`btn btn--primary btn--block btn--small${added === product.id ? ' btn--added' : ''}`}
                    type="button"
                    onClick={() => handleAdd(product.id)}
                  >
                    {added === product.id ? <><Check size={16} /> {copy.added}</> : <><Plus size={16} /> {copy.addToBasket}{inCart ? ` (${inCart})` : ''}</>}
                  </button>
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
