import {
  AuthError, ForbiddenError, InputError, dbFetch, readJson, requireAdmin, send,
  type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type ProductRow = {
  id: string
  name: string
  category: string
  price: number | string
  unit: string
  emoji: string
  tone: string
  stock: number | string
  image: string | null
  is_active?: boolean
}

const tones = new Set(['red', 'orange', 'brown', 'green', 'amber', 'teal'])

function mapProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    unit: row.unit,
    emoji: row.emoji,
    tone: tones.has(row.tone) ? row.tone : 'green',
    stock: Number(row.stock),
    image: row.image ?? '',
    active: row.is_active !== false,
  }
}

function productFromBody(body: Record<string, unknown>) {
  const name = String(body.name ?? '').trim()
  const category = String(body.category ?? '').trim()
  const price = Number(body.price)
  const stock = Number(body.stock)
  const tone = String(body.tone ?? 'green')

  if (name.length < 2) throw new InputError('Enter a product name.')
  if (!category) throw new InputError('Choose a category.')
  if (!Number.isFinite(price) || price <= 0) throw new InputError('Enter a price greater than zero.')
  if (!Number.isInteger(stock) || stock < 0) throw new InputError('Enter a valid stock quantity.')
  if (!tones.has(tone)) throw new InputError('Choose a valid colour.')

  return {
    id: String(body.id ?? '').trim() || `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    category,
    price,
    unit: String(body.unit ?? 'per kg').trim() || 'per kg',
    emoji: String(body.emoji ?? '🥬').trim() || '🥬',
    tone,
    stock,
    image: String(body.image ?? '').trim() || null,
    is_active: body.active !== false,
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === 'GET') {
      const response = await dbFetch('/products?select=id,name,category,price,unit,emoji,tone,stock,image,is_active&order=created_at.asc')
      if (!response.ok) throw new Error('Product catalogue lookup failed')
      const rows = await response.json() as ProductRow[]
      return send(res, 200, rows.map(mapProduct))
    }

    if (req.method === 'POST') {
      await requireAdmin(req)
      const product = productFromBody(await readJson(req))
      const response = await dbFetch('/products?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(product),
      })
      if (!response.ok) throw new Error('Product save failed')
      const rows = await response.json() as ProductRow[]
      return send(res, 200, { product: mapProduct(rows[0] ?? product) })
    }

    if (req.method === 'DELETE') {
      await requireAdmin(req)
      const url = new URL(req.url ?? '', 'http://localhost')
      const id = String(url.searchParams.get('id') ?? '').trim()
      if (!id) throw new InputError('Choose a product to delete.')
      const response = await dbFetch(`/products?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      })
      if (!response.ok) throw new Error('Product delete failed')
      return send(res, 200, { ok: true })
    }

    return send(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof AuthError || error instanceof ForbiddenError) {
      return send(res, error instanceof AuthError ? 401 : 403, { error: error.message })
    }
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Products API failed:', error)
    return send(res, 500, { error: 'The product catalogue is temporarily unavailable. Please try again.' })
  }
}
