import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth-context'
import { DataContext, type DataContextValue, type StoredData, type TrackEventInput } from './data-store'
import { isStaff } from './roles'
import type { ActivityEvent, AppNotification, CartLine, Customer, Order, OrderStatus, Product, Role } from './types'

const LEGACY_STORAGE_KEY = 'freshpoint-data-v1'
const CART_STORAGE_KEY = 'freshpoint-cart-v1'
const NOTIFICATION_READS_KEY = 'freshpoint-notification-reads-v1'
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000
const NOTIFICATION_POLL_MS = 15 * 1000
const ACTIVITY_POLL_MS = 60 * 1000
const PENDING_LOGIN_KEY = 'freshpoint:pending-login'

type StoredCart = { lines: CartLine[]; savedAt: number }
type DataState = StoredData & {
  ordersToken: string
  customersToken: string
  notificationsToken: string
  eventsToken: string
  notificationReads: string[]
}

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fail(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({})) as { error?: string }
  throw new Error(payload.error ?? fallback)
}

function cleanCart(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) return []
  const seen = new Set<string>()
  return lines.flatMap((line) => {
    if (!line || typeof line !== 'object') return []
    const candidate = line as Partial<CartLine>
    const productId = typeof candidate.productId === 'string' ? candidate.productId : ''
    const quantity = Number(candidate.quantity)
    if (!productId || seen.has(productId) || !Number.isFinite(quantity) || quantity <= 0) return []
    seen.add(productId)
    return [{ productId, quantity: Math.floor(quantity) }]
  })
}

function loadCart(): CartLine[] {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<StoredCart>
    const savedAt = Number(parsed.savedAt)
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > CART_TTL_MS) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return []
    }
    return cleanCart(parsed.lines)
  } catch {
    return []
  }
}

function availableCart(cart: CartLine[], products: Product[]): CartLine[] {
  return cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId)
    if (!product || product.active === false || product.stock <= 0) return []
    return [{ ...line, quantity: Math.min(line.quantity, product.stock) }]
  })
}

function notificationReadsKey(userId: string) {
  return `${NOTIFICATION_READS_KEY}:${userId}`
}

function loadNotificationReads(userId: string): string[] {
  try {
    const raw = localStorage.getItem(notificationReadsKey(userId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveNotificationReads(userId: string, ids: string[]) {
  try {
    localStorage.setItem(notificationReadsKey(userId), JSON.stringify(ids))
  } catch {
    // Read state is a convenience; notifications remain available in memory.
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth()
  const token = session?.access_token
  const staff = isStaff(user)
  const [data, setData] = useState<DataState>(() => ({
    products: [],
    orders: [],
    customers: [],
    cart: loadCart(),
    notifications: [],
    events: [],
    ordersToken: '',
    customersToken: '',
    notificationsToken: '',
    eventsToken: '',
    notificationReads: [],
  }))

  const trackEvent = useCallback((input: TrackEventInput) => {
    if (!token) return
    void fetch('/api/customers?view=events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(input),
      keepalive: true,
    }).catch(() => undefined)
  }, [token])

  useEffect(() => {
    if (!token || !user?.id) return
    const sessionKey = `freshpoint:session:${user.id}`
    let seen = false
    let pendingLogin = false
    try {
      seen = window.sessionStorage.getItem(sessionKey) === '1'
      pendingLogin = window.sessionStorage.getItem(PENDING_LOGIN_KEY) === '1'
      window.sessionStorage.removeItem(PENDING_LOGIN_KEY)
      if (!seen) window.sessionStorage.setItem(sessionKey, '1')
    } catch {
      // Session storage may be unavailable; fall back to one event per mount.
    }
    if (seen) return
    trackEvent({
      action: pendingLogin ? 'session.login' : 'session.open',
      targetType: 'session',
      targetId: user.id,
    })
  }, [token, user?.id, trackEvent])

  useEffect(() => {
    let active = true
    fetch('/api/products', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((rows: unknown) => {
        if (!active || !Array.isArray(rows)) return
        const available = rows as Product[]
        setData((current) => ({
          ...current,
          products: available,
          cart: availableCart(current.cart, available),
        }))
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  async function refreshOrders() {
    if (!token) return
    const response = await fetch('/api/orders', {
      headers: authHeaders(token),
      cache: 'no-store',
    })
    if (!response.ok) await fail(response, 'We could not load orders. Please try again.')
    const orders = await response.json() as Order[]
    setData((current) => ({ ...current, orders, ordersToken: token ?? '' }))
  }

  async function refreshNotifications() {
    if (!token || !user?.id) return
    const response = await fetch('/api/orders?view=notifications', {
      headers: authHeaders(token),
      cache: 'no-store',
    })
    if (!response.ok) await fail(response, 'We could not load notifications. Please try again.')
    const rows = await response.json() as AppNotification[]
    const reads = loadNotificationReads(user.id)
    setData((current) => ({
      ...current,
      notifications: rows.map((item) => ({ ...item, read: reads.includes(item.id) })),
      notificationsToken: token,
      notificationReads: reads,
    }))
  }

  async function refreshEvents() {
    if (!token || user?.app_metadata?.role !== 'admin') return
    const response = await fetch('/api/customers?view=events', { headers: authHeaders(token), cache: 'no-store' })
    if (!response.ok) return
    const rows = await response.json() as ActivityEvent[]
    setData((current) => ({ ...current, events: rows, eventsToken: token }))
  }

  useEffect(() => {
    if (!token || !user?.id) return
    let active = true
    const load = async () => {
      try {
        const response = await fetch('/api/orders?view=notifications', { headers: authHeaders(token), cache: 'no-store' })
        if (!response.ok || !active) return
        const rows = await response.json() as AppNotification[]
        const reads = loadNotificationReads(user.id!)
        if (!active) return
        setData((current) => ({
          ...current,
          notifications: rows.map((item) => ({ ...item, read: reads.includes(item.id) })),
          notificationsToken: token,
          notificationReads: reads,
        }))
      } catch {
        // Notifications are non-critical; the next poll will retry.
      }
    }
    void load()
    const timer = window.setInterval(() => { void load() }, NOTIFICATION_POLL_MS)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [token, user?.id])

  useEffect(() => {
    if (!token) return
    let active = true
    fetch('/api/orders', { headers: authHeaders(token), cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((rows: unknown) => {
        if (!active || !Array.isArray(rows)) return
        setData((current) => ({ ...current, orders: rows as Order[], ordersToken: token }))
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (!token || !staff) return
    let active = true
    fetch('/api/customers', { headers: authHeaders(token), cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((rows: unknown) => {
        if (!active || !Array.isArray(rows)) return
        setData((current) => ({ ...current, customers: rows as StoredData['customers'], customersToken: token }))
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [token, staff])

  useEffect(() => {
    if (!token || user?.app_metadata?.role !== 'admin') return
    let active = true
    const load = async () => {
      try {
        const response = await fetch('/api/customers?view=events', { headers: authHeaders(token), cache: 'no-store' })
        if (!response.ok || !active) return
        const rows = await response.json() as ActivityEvent[]
        if (!active) return
        setData((current) => ({ ...current, events: rows, eventsToken: token }))
      } catch {
        // Activity is non-critical; the next poll will retry.
      }
    }
    void load()
    const timer = window.setInterval(() => { void load() }, ACTIVITY_POLL_MS)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [token, user?.app_metadata?.role])

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines: data.cart, savedAt: Date.now() } satisfies StoredCart))
    } catch {
      // Storage can be unavailable in private browsing; the cart still works in memory.
    }
  }, [data.cart])

  const cartCount = data.cart.reduce((sum, line) => sum + line.quantity, 0)
  const cartTotal = data.cart.reduce((sum, line) => {
    const product = data.products.find((item) => item.id === line.productId)
    return sum + (product?.price ?? 0) * line.quantity
  }, 0)

  function addToCart(productId: string) {
    setData((current) => {
      const existing = current.cart.find((line) => line.productId === productId)
      const cart = existing
        ? current.cart.map((line) => line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current.cart, { productId, quantity: 1 }]
      return { ...current, cart }
    })
  }

  function setCartQuantity(productId: string, quantity: number) {
    setData((current) => {
      if (!Number.isFinite(quantity)) return current
      const requested = Math.floor(quantity)
      const product = current.products.find((item) => item.id === productId)
      const max = product ? (product.active === false ? 0 : Math.max(0, product.stock)) : requested
      const next = Math.min(requested, max)
      const existing = current.cart.some((line) => line.productId === productId)
      return {
        ...current,
        cart: next <= 0
          ? current.cart.filter((line) => line.productId !== productId)
          : existing
            ? current.cart.map((line) => line.productId === productId ? { ...line, quantity: next } : line)
            : [...current.cart, { productId, quantity: next }],
      }
    })
  }

  function clearCart() {
    setData((current) => ({ ...current, cart: [] }))
  }

  async function placeOrder(details: { customer: string; phone: string; address: string }) {
    const lines = availableCart(data.cart, data.products)
    if (!lines.length) throw new Error('Your basket is empty. Add a product first.')

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({
        ...details,
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      }),
    })
    if (!response.ok) await fail(response, 'We could not place your order. Please try again.')
    const payload = await response.json() as { order: Order }
    const order = payload.order
    setData((current) => ({
      ...current,
      orders: [order, ...current.orders.filter((item) => item.id !== order.id)],
      cart: [],
    }))
    return order
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const response = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ orderId, status }),
    })
    if (!response.ok) await fail(response, 'We could not update this order. Please try again.')
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === orderId ? { ...order, status } : order),
    }))
  }

  async function setCustomerRole(customerId: string, role: Extract<Role, 'manager' | 'customer'>) {
    const response = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ userId: customerId, role }),
    })
    if (!response.ok) await fail(response, 'We could not change this role. Please try again.')
    setData((current) => ({
      ...current,
      customers: current.customers.map((customer) => customer.id === customerId ? { ...customer, role } : customer),
    }))
  }

  async function saveCustomer(customer: Customer) {
    const response = await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({
        userId: customer.id,
        fullName: customer.name,
        username: customer.username,
        email: customer.email,
        phone: customer.phone,
        address: customer.address ?? '',
        role: customer.role === 'manager' ? 'manager' : 'customer',
      }),
    })
    if (!response.ok) await fail(response, 'We could not save this customer. Please try again.')
    setData((current) => ({
      ...current,
      customers: current.customers.map((item) => item.id === customer.id ? customer : item),
    }))
  }

  async function saveProduct(product: Product) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(product),
    })
    if (!response.ok) await fail(response, 'We could not save the product. Please try again.')
    const payload = await response.json() as { product: Product }
    const saved = payload.product
    setData((current) => {
      const products = current.products.some((item) => item.id === saved.id)
        ? current.products.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current.products]
      return { ...current, products, cart: availableCart(current.cart, products) }
    })
  }

  async function deleteProduct(productId: string) {
    const response = await fetch(`/api/products?id=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    })
    if (!response.ok) await fail(response, 'We could not delete the product. Please try again.')
    setData((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== productId),
      cart: current.cart.filter((line) => line.productId !== productId),
    }))
  }

  function markNotificationRead(id: string) {
    if (!user?.id) return
    const reads = Array.from(new Set([...data.notificationReads, id]))
    saveNotificationReads(user.id, reads)
    setData((current) => ({
      ...current,
      notificationReads: reads,
      notifications: current.notifications.map((item) => item.id === id ? { ...item, read: true } : item),
    }))
  }

  function markAllNotificationsRead() {
    if (!user?.id) return
    const reads = Array.from(new Set([...data.notificationReads, ...data.notifications.map((item) => item.id)]))
    saveNotificationReads(user.id, reads)
    setData((current) => ({
      ...current,
      notificationReads: reads,
      notifications: current.notifications.map((item) => ({ ...item, read: true })),
    }))
  }

  const unreadNotificationCount = data.notificationsToken === token
    ? data.notifications.filter((item) => !item.read).length
    : 0

  const value: DataContextValue = {
    ...data,
    notifications: data.notificationsToken === token ? data.notifications : [],
    events: user?.app_metadata?.role === 'admin' && data.eventsToken === token ? data.events : [],
    orders: data.ordersToken === token ? data.orders : [],
    customers: staff && data.customersToken === token ? data.customers : [],
    cartCount,
    cartTotal,
    addToCart,
    setCartQuantity,
    clearCart,
    placeOrder,
    updateOrderStatus,
    setCustomerRole,
    saveCustomer,
    refreshOrders,
    refreshNotifications,
    refreshEvents,
    trackEvent,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationCount,
    saveProduct,
    deleteProduct,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
