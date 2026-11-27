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
  const [editor, setEditor] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState<Product>(emptyProduct)
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const categoryOptions = Array.from(new Set([...defaultCategories, ...products.map((product) => product.category)]))
  const activeCount = products.filter((product) => product.active !== false).length
  const lowStockCount = products.filter((product) => product.stock <= 10).length

  function showCreate() {
    setForm(emptyProduct)
    setError('')
    setConfirmProduct(null)
    setEditor('create')
  }

  function showEdit(product: Product) {
    setForm({ ...product })
    setError('')
    setConfirmProduct(null)
    setEditor('edit')
  }

  function closeEditor() {
    setEditor(null)
    setForm(emptyProduct)
    setError('')
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
      closeEditor()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not save the product. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirmProduct || busy) return
    setError('')
    setBusy(true)
    try {
      await deleteProduct(confirmProduct.id)
      if (form.id === confirmProduct.id) closeEditor()
      setConfirmProduct(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not delete the product. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page catalogue-page">
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

      <div className="catalogue-summary" aria-label="Catalogue summary">
        <div className="catalogue-summary__card"><strong>{products.length}</strong><span>All products</span></div>
        <div className="catalogue-summary__card"><strong>{activeCount}</strong><span>Visible in shop</span></div>
        <div className="catalogue-summary__card"><strong>{lowStockCount}</strong><span>Low stock</span></div>
      </div>

      {!editor && !confirmProduct && error ? <p className="field-error admin-inline-error">{error}</p> : null}

      <div className="admin-panel catalogue-panel">
        <div className="admin-panel__head"><h2>All products</h2><span className="admin-muted">Saved for every customer</span></div>
        {products.length ? (
          <div className="product-list">
            {products.map((product) => (
              <article className="product-row" key={product.id}>
                <button
                  type="button"
                  className="product-row__open"
                  onClick={() => showEdit(product)}
                  aria-label={`Open ${product.name}`}
                >
                  <span className="product-row__art">
                    <ProductImage image={product.image} emoji={product.emoji} className={`cart-line__art cart-line__art--${product.tone}`} />
                  </span>
                  <span className="product-row__main">
                    <strong>{product.name}</strong>
                    <small>{product.category} · {product.unit}{product.active === false ? ' · hidden' : ''}</small>
                  </span>
                  <span className="product-row__meta">
                    <strong>{formatMoney(product.price)}</strong>
                    <span className={`stock-pill${product.stock <= 10 ? ' stock-pill--low' : ' stock-pill--ok'}`}>{product.stock} left</span>
                  </span>
                </button>
                <div className="product-row__actions">
                  <button type="button" onClick={() => showEdit(product)} aria-label={`Edit ${product.name}`} title="Edit product"><Pencil size={17} /></button>
                  <button type="button" onClick={() => { setError(''); setConfirmProduct(product) }} aria-label={`Delete ${product.name}`} title="Delete product"><Trash2 size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><Package size={28} /><h3>No products yet</h3><p>Add your first product with the button above.</p></div>
        )}
      </div>

      {editor ? (
        <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}>
          <div className="editor-sheet" role="dialog" aria-modal="true" aria-labelledby="product-sheet-title">
            <div className="editor-sheet__head">
              <div>
                <p className="eyebrow">Catalogue</p>
                <h2 id="product-sheet-title">{editor === 'create' ? 'New product' : 'Edit product'}</h2>
              </div>
              <button className="admin-icon-button" type="button" onClick={closeEditor} aria-label="Close product editor"><X size={20} /></button>
            </div>

            <form className="admin-form editor-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
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
                <button className="btn btn--primary btn--block btn--large" type="submit" disabled={busy}><Save size={16} /> {busy ? 'Saving…' : 'Save product'}</button>
                <button className="btn btn--outline btn--block" type="button" onClick={closeEditor}><X size={16} /> Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmProduct ? (
        <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setConfirmProduct(null) }}>
          <div className="confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title">
            <div className="confirm-sheet__icon"><Trash2 size={24} /></div>
            <h2 id="delete-product-title">Delete product?</h2>
            <p>Remove <strong>{confirmProduct.name}</strong> from the catalogue? Customers will no longer see it.</p>
            {error ? <p className="field-error">{error}</p> : null}
            <div className="admin-form__actions">
              <button className="btn btn--danger btn--block btn--large" type="button" disabled={busy} onClick={() => void handleDelete()}>
                {busy ? 'Deleting…' : 'Delete product'}
              </button>
              <button className="btn btn--outline btn--block" type="button" disabled={busy} onClick={() => setConfirmProduct(null)}>Keep product</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
