import { randomInt } from 'node:crypto'
import {
  AuthError, ForbiddenError, InputError, dbFetch, readJson, recordAudit, requireStaff, requireUser,
  roleFromUser, send, sendPush, type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

type OrderRow = {
  id: string
  customer: string
  phone: string
  address: string
  total: number | string
  status: string
  created_at: string
}

type ItemRow = {
  order_id: string
  product_id: string | null
  name: string
  quantity: number
  price: number | string
  emoji: string | null
  image: string | null
}

type ProductRow = {
  id: string
  name: string
  price: number | string
  emoji: string | null
  image: string | null
  is_active: boolean
  stock: number
}

const statuses = new Set(['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'])
const orderColumns = 'id,customer,phone,address,total,status,created_at'
const itemColumns = 'order_id,product_id,name,quantity,price,emoji,image'

type AuditRow = {
  id: number | string
  created_at: string
  action: string
  target_id: string
  details: Record<string, unknown>
}

const statusTitles: Record<string, string> = {
  Pending: 'Order received',
  Preparing: 'Order approved',
  'Out for delivery': 'On the way',
  Delivered: 'Delivered',
  Cancelled: 'Order cancelled',
}

function mapNotification(row: AuditRow) {
  const status = String(row.details?.status ?? '')
  const orderId = row.target_id || ''
  return {
    id: String(row.id),
    title: row.action === 'order.created' ? 'Order placed' : statusTitles[status] ?? 'Order update',
    body: row.action === 'order.created'
      ? `Order ${orderId} was received and is being reviewed.`
      : `Order ${orderId} is now ${status.toLowerCase()}.`,
    orderId,
    status,
    createdAt: row.created_at,
  }
}

function mapOrder(row: OrderRow, items: ItemRow[] = []) {
  return {
    id: row.id,
    customer: row.customer,
    phone: row.phone,
    address: row.address,
    items: items.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price),
      emoji: '',
      image: item.image,
      productId: item.product_id,
    })),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
  }
}

async function itemsForOrders(ids: string[]) {
  if (!ids.length) return [] as ItemRow[]
  const response = await dbFetch(`/order_items?select=${itemColumns}&order_id=in.(${ids.join(',')})&order=created_at.asc`)
  if (!response.ok) throw new Error('Order items lookup failed')
  return await response.json() as ItemRow[]
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === 'GET') {
      const user = await requireUser(req)
      const url = new URL(req.url ?? '', 'http://localhost')
      if (url.searchParams.get('view') === 'notifications') {
        const role = roleFromUser(user)
        const staff = role === 'admin' || role === 'manager'
        const ownerFilter = staff ? '' : `&user_id=eq.${encodeURIComponent(user.id)}`
        const ordersResponse = await dbFetch(`/orders?select=id${ownerFilter}&limit=200`)
        if (!ordersResponse.ok) throw new Error('Order lookup failed')
        const orderRows = await ordersResponse.json() as Array<{ id: string }>
        const orderIds = new Set(orderRows.map((row) => row.id))

        const audienceFilter = staff ? '' : `&details->>userId=eq.${encodeURIComponent(user.id)}`
        const response = await dbFetch(
          `/audit_logs?select=id,created_at,action,target_id,details&action=in.(order.created,order.status_change)${audienceFilter}&order=created_at.desc&limit=100`,
        )
        if (!response.ok) throw new Error('Notification lookup failed')
        const rows = await response.json() as AuditRow[]
        return send(res, 200, rows.filter((row) => orderIds.has(row.target_id)).map(mapNotification))
      }

      const role = roleFromUser(user)
      const filter = role === 'admin' || role === 'manager' ? '' : `&user_id=eq.${encodeURIComponent(user.id)}`
      const response = await dbFetch(`/orders?select=${orderColumns}${filter}&order=created_at.desc&limit=200`)
      if (!response.ok) throw new Error('Order lookup failed')
      const rows = await response.json() as OrderRow[]
      const items = await itemsForOrders(rows.map((row) => row.id))
      const grouped = new Map<string, ItemRow[]>()
      for (const item of items) {
        const group = grouped.get(item.order_id) ?? []
        group.push(item)
        grouped.set(item.order_id, group)
      }
      return send(res, 200, rows.map((row) => mapOrder(row, grouped.get(row.id))))
    }

    if (req.method === 'POST') {
      const user = await requireUser(req)
      const body = await readJson(req)
      const customer = String(body.customer ?? '').trim()
      const phone = String(body.phone ?? '').trim()
      const address = String(body.address ?? '').trim()
      if (customer.length < 2) throw new InputError('Enter a delivery name.')
      if (phone.length < 9) throw new InputError('Enter a valid phone number.')
      if (address.length < 5) throw new InputError('Enter a delivery address.')

      const rawItems = body.items
      if (!Array.isArray(rawItems) || !rawItems.length) throw new InputError('Your basket is empty.')
      const seen = new Set<string>()
      const requested = rawItems.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const item = entry as { productId?: unknown; quantity?: unknown }
        const productId = String(item.productId ?? '').trim()
        const quantity = Number(item.quantity)
        if (!productId || seen.has(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return []
        seen.add(productId)
        return [{ productId, quantity }]
      })
      if (!requested.length) throw new InputError('Your basket is empty.')

      const productResponse = await dbFetch(`/products?select=id,name,price,emoji,image,is_active,stock&id=in.(${requested.map((item) => item.productId).join(',')})`)
      if (!productResponse.ok) throw new Error('Product lookup failed')
      const products = await productResponse.json() as ProductRow[]
      const byId = new Map(products.map((product) => [product.id, product]))

      const items = requested.flatMap(({ productId, quantity }) => {
        const product = byId.get(productId)
        if (!product || product.is_active === false || product.stock < quantity) return []
        return [{
          product_id: productId,
          name: product.name,
          quantity,
          price: Number(product.price),
          emoji: '',
          image: product.image,
        }]
      })
      if (items.length !== requested.length) throw new InputError('Some products are no longer available. Review your basket and try again.')

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const order = {
        id: `FP-${Date.now()}-${randomInt(10, 99)}`,
        user_id: user.id,
        customer,
        phone,
        address,
        total,
        status: 'Pending',
      }
      const orderResponse = await dbFetch('/orders', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(order),
      })
      if (!orderResponse.ok) throw new Error('Order creation failed')
      const orderRows = await orderResponse.json() as OrderRow[]

      const itemResponse = await dbFetch('/order_items', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(items.map((item) => ({ ...item, order_id: order.id }))),
      })
      if (!itemResponse.ok) {
        await dbFetch(`/orders?id=eq.${encodeURIComponent(order.id)}`, { method: 'DELETE' }).catch(() => undefined)
        throw new Error('Order item creation failed')
      }
      await recordAudit(user, 'order.created', 'order', order.id, { userId: user.id, status: 'Pending' })
      await sendPush(
        'Order placed',
        `Order ${order.id} was received and is being reviewed.`,
        '/app/orders',
        { userIds: [user.id] },
      ).catch((error) => console.error('Customer push failed:', error))
      await sendPush(
        'New order placed',
        `${customer} placed order ${order.id}.`,
        '/admin/orders',
        { staff: true },
      ).catch((error) => console.error('Staff push failed:', error))

      return send(res, 200, {
        order: mapOrder(
          orderRows[0] ?? { ...order, created_at: new Date().toISOString() },
          items.map((item) => ({ ...item, order_id: order.id })),
        ),
      })
    }

    if (req.method === 'PATCH') {
      const actor = await requireStaff(req)
      const body = await readJson(req)
      const orderId = String(body.orderId ?? '').trim()
      const status = String(body.status ?? '').trim()
      if (!orderId) throw new InputError('Choose an order to update.')
      if (!statuses.has(status)) throw new InputError('Choose a valid order status.')

      const existingResponse = await dbFetch(`/orders?select=user_id,status&id=eq.${encodeURIComponent(orderId)}`)
      if (!existingResponse.ok) throw new Error('Order lookup failed')
      const existingRows = await existingResponse.json() as Array<{ user_id: string; status: string }>
      if (!existingRows.length) throw new InputError('That order could not be found.')
      const previous = existingRows[0]

      const response = await dbFetch(`/orders?id=eq.${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Order update failed')
      const rows = await response.json() as OrderRow[]
      if (!rows.length) throw new InputError('That order could not be found.')
      await recordAudit(actor, 'order.status_change', 'order', orderId, {
        userId: previous.user_id,
        from: previous.status,
        status,
      })
      await sendPush(
        statusTitles[status] ?? 'Order update',
        `Order ${orderId} is now ${status.toLowerCase()}.`,
        '/app/orders',
        { userIds: [previous.user_id] },
      ).catch((error) => console.error('Status push failed:', error))
      return send(res, 200, { order: mapOrder(rows[0]) })
    }

    return send(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof AuthError || error instanceof ForbiddenError) {
      return send(res, error instanceof AuthError ? 401 : 403, { error: error.message })
    }
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Orders API failed:', error)
    return send(res, 500, { error: 'Orders are temporarily unavailable. Please try again.' })
  }
}
