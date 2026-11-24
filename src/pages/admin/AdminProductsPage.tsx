import { useState, type FormEvent } from 'react'
import { Package, Plus, Save, X } from 'lucide-react'
import { ProductImage } from '../../components/ProductImage'
import { categories } from '../../lib/demo-data'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'
import type { Product } from '../../lib/types'

const tones: Product['tone'][] = ['green', 'orange', 'amber', 'brown', 'red', 'teal']
const emojis = ['🥬', '🥭', '🌾', '🥔', '🧄', '🍅', '🥕', '🍌', '🫘', '🥜']

const emptyProduct: Product = {
  id: '', name: '', category: 'Vegetables', price: 0, unit: 'per kg', emoji: '🥬', tone: 'green', stock: 0, image: '',
}

export function AdminProductsPage() {
  const { products, saveProduct } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Product>(emptyProduct)
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (form.name.trim().length < 2) { setError('Enter a product name.'); return }
    if (form.price <= 0) { setError('Enter a price greater than zero.'); return }
    if (form.stock < 0) { setError('Stock cannot be negative.'); return }
    saveProduct({ ...form, id: form.id || `p-${Date.now()}`, name: form.name.trim() })
    setForm(emptyProduct)
    setOpen(false)
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1>Products</h1>
          <p>Manage produce, prices and available stock.</p>
        </div>
        <button className="btn btn--primary btn--small" type="button" onClick={() => { setOpen((value) => !value); setError('') }}>
          {open ? <><X size={16} /> Close</> : <><Plus size={16} /> Add product</>}
        </button>
      </header>

      {open ? (
        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <h2>New product</h2>
          <div className="admin-form__grid">
            <div className="field"><label htmlFor="productName">Name</label>
              <input id="productName" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sweet potatoes" />
            </div>
            <div className="field"><label htmlFor="productCategory">Category</label>
              <select id="productCategory" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="productPrice">Price (SSP)</label>
              <input id="productPrice" type="number" min="1" value={form.price || ''} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} inputMode="numeric" />
            </div>
            <div className="field"><label htmlFor="productUnit">Unit</label>
              <input id="productUnit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="per kg" />
            </div>
            <div className="field"><label htmlFor="productStock">Stock</label>
              <input id="productStock" type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} inputMode="numeric" />
            </div>
            <div className="field"><label htmlFor="productImage">Image key / URL</label>
              <input id="productImage" value={form.image ?? ''} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="products/tomatoes.jpg" />
            </div>
            <div className="field"><label htmlFor="productEmoji">Icon</label>
              <select id="productEmoji" value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })}>
                {emojis.map((emoji) => <option key={emoji} value={emoji}>{emoji}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label htmlFor="productTone">Colour</label>
            <select id="productTone" value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value as Product['tone'] })}>
              {tones.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
            </select>
          </div>
          {error ? <p className="field-error">{error}</p> : null}
          <button className="btn btn--primary" type="submit"><Save size={16} /> Save product</button>
        </form>
      ) : null}

      <div className="admin-panel">
        <div className="admin-panel__head"><h2>All products</h2><span className="admin-muted">{products.length} items</span></div>
        <div className="product-table">
          <div className="product-table__head"><span>Product</span><span>Price</span><span>Stock</span></div>
          {products.map((product) => (
            <div className="product-table__row" key={product.id}>
              <div className="product-table__name"><ProductImage image={product.image} emoji={product.emoji} className={`cart-line__art cart-line__art--${product.tone}`} /><div><strong>{product.name}</strong><small>{product.category} · {product.unit}</small></div></div>
              <strong>{formatMoney(product.price)}</strong>
              <span className={`stock-pill${product.stock <= 10 ? ' stock-pill--low' : ''}`}>{product.stock}</span>
            </div>
          ))}
        </div>
      </div>
      {!products.length ? <div className="empty-state"><Package size={28} /><h3>No products yet</h3><p>Add your first product above.</p></div> : null}
    </div>
  )
}
