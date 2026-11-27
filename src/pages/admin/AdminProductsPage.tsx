import { useState, type FormEvent } from 'react'
import { Package, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { ImageUploadField } from '../../components/ImageUploadField'
import { ProductImage } from '../../components/ProductImage'
import { categories as defaultCategories } from '../../lib/categories'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'
import type { Product } from '../../lib/types'

const tones: Product['tone'][] = ['green', 'orange', 'amber', 'brown', 'red', 'teal']
const emojis = ['🥬', '🥭', '🌾', '🥔', '🧄', '🍅', '🥕', '🍌', '🫘', '🥜']

const emptyProduct: Product = {
  id: '', name: '', category: 'Vegetables', price: 0, unit: 'per kg', emoji: '🥬', tone: 'green', stock: 0, image: '', active: true,
}

export function AdminProductsPage() {
  const { products, saveProduct, deleteProduct } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Product>(emptyProduct)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const categoryOptions = Array.from(new Set([...defaultCategories, ...products.map((product) => product.category)]))

  function showCreate() {
    setForm(emptyProduct)
    setError('')
    setOpen(true)
  }

  function showEdit(product: Product) {
    setForm({ ...product })
    setError('')
    setOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (form.name.trim().length < 2) { setError('Enter a product name.'); return }
    if (form.price <= 0) { setError('Enter a price greater than zero.'); return }
    if (form.stock < 0) { setError('Stock cannot be negative.'); return }

    setBusy(true)
    try {
      await saveProduct({ ...form, id: form.id || `p-${Date.now()}`, name: form.name.trim() })
      setForm(emptyProduct)
      setOpen(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not save the product. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete ${product.name} from the catalogue?`)) return
    setError('')
    setBusy(true)
    try {
      await deleteProduct(product.id)
      if (form.id === product.id) {
        setForm(emptyProduct)
        setOpen(false)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not delete the product. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1>Products</h1>
          <p>Add, edit or remove produce, prices and stock for every customer.</p>
        </div>
        <button className="btn btn--primary btn--small" type="button" onClick={showCreate}>
          <Plus size={16} /> Add product
        </button>
      </header>

      {open ? (
        <form className="admin-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <h2>{form.id ? 'Edit product' : 'New product'}</h2>
          <div className="admin-form__grid">
            <div className="field"><label htmlFor="productName">Name</label>
              <input id="productName" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sweet potatoes" />
            </div>
            <div className="field"><label htmlFor="productCategory">Category</label>
              <input id="productCategory" list="productCategories" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Vegetables" />
              <datalist id="productCategories">
                {categoryOptions.map((category) => <option key={category} value={category} />)}
              </datalist>
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
            <ImageUploadField
              label="Product image"
              value={form.image ?? ''}
              onChange={(key) => setForm((current) => ({ ...current, image: key }))}
              folder="products"
            />
            <div className="field"><label htmlFor="productEmoji">Icon</label>
              <select id="productEmoji" value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })}>
                {emojis.map((emoji) => <option key={emoji} value={emoji}>{emoji}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="productTone">Colour</label>
              <select id="productTone" value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value as Product['tone'] })}>
                {tones.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
              </select>
            </div>
          </div>
          <label className="admin-form__check">
            <input type="checkbox" checked={form.active !== false} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            Visible in the shop and on the website
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <div className="admin-form__actions">
            <button className="btn btn--primary" type="submit" disabled={busy}><Save size={16} /> {busy ? 'Saving…' : 'Save product'}</button>
            <button className="btn btn--outline" type="button" onClick={() => { setForm(emptyProduct); setOpen(false); setError('') }}><X size={16} /> Cancel</button>
          </div>
        </form>
      ) : null}
      {!open && error ? <p className="field-error">{error}</p> : null}

      <div className="admin-panel">
        <div className="admin-panel__head"><h2>All products</h2><span className="admin-muted">{products.length} items · saved for every customer</span></div>
        <div className="product-table">
          <div className="product-table__head"><span>Product</span><span>Price</span><span>Stock</span><span>Actions</span></div>
          {products.map((product) => (
            <div className="product-table__row" key={product.id}>
              <div className="product-table__name">
                <ProductImage image={product.image} emoji={product.emoji} className={`cart-line__art cart-line__art--${product.tone}`} />
                <div><strong>{product.name}</strong><small>{product.category} · {product.unit}{product.active === false ? ' · hidden' : ''}</small></div>
              </div>
              <strong>{formatMoney(product.price)}</strong>
              <span className={`stock-pill${product.stock <= 10 ? ' stock-pill--low' : ''}`}>{product.stock}</span>
              <div className="admin-row-actions">
                <button type="button" onClick={() => showEdit(product)} aria-label={`Edit ${product.name}`} title="Edit product"><Pencil size={16} /></button>
                <button type="button" onClick={() => void handleDelete(product)} disabled={busy} aria-label={`Delete ${product.name}`} title="Delete product"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {!products.length ? <div className="empty-state"><Package size={28} /><h3>No products yet</h3><p>Add your first product above.</p></div> : null}
    </div>
  )
}
