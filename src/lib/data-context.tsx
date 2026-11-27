import { useEffect, useState, type ReactNode } from 'react'
import { demoCustomers, demoOrders, demoProducts } from './demo-data'
import { DataContext, type DataContextValue, type StoredData } from './data-store'
import { supabase } from './supabase'
import type { CartLine, Customer, Order, OrderStatus, Product } from './types'

const STORAGE_KEY = 'freshpoint-data-v1'
const CART_STORAGE_KEY = 'freshpoint-cart-v1'
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000

type StoredCart = { lines: CartLine[]; savedAt: number }

async function sessionHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
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

function loadLegacyCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return cleanCart((JSON.parse(raw) as Partial<StoredData>).cart)
  } catch {
    return []
  }
}

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      const legacy = loadLegacyCart()
      if (legacy.length) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines: legacy, savedAt: Date.now() } satisfies StoredCart))
      }
      return legacy
    }
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

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredData>
      if (Array.isArray(parsed.products) && Array.isArray(parsed.orders)) {
        return {
          products: parsed.products,
          orders: parsed.orders,
          customers: Array.isArray(parsed.customers) ? parsed.customers : demoCustomers,
          cart: [],
        }
      }
    }
  } catch {
    // Fall through to the seeded catalogue.
  }
  return { products: demoProducts, orders: demoOrders, customers: demoCustomers, cart: [] }
}

function availableCart(cart: CartLine[], products: Product[]): CartLine[] {
  return cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId)
    if (!product || product.active === false || product.stock <= 0) return []
    return [{ ...line, quantity: Math.min(line.quantity, product.stock) }]
  })
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoredData>(() => ({ ...loadData(), cart: loadCart() }))
  const { products, orders, customers } = data

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, orders, customers }))
    } catch {
      // Storage can be unavailable in private browsing; the app still works in memory.
    }
  }, [products, orders, customers])

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines: data.cart, savedAt: Date.now() } satisfies StoredCart))
    } catch {
      // Storage can be unavailable in private browsing; the app still works in memory.
    }
  }, [data.cart])

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
      .catch(() => {
        // Keep the cached catalogue when the network is unavailable.
      })
    return () => { active = false }
  }, [])

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

  function placeOrder(details: { customer: string; phone: string; address: string }) {
    const orderLines = availableCart(data.cart, data.products)
    const items = orderLines.flatMap((line) => {
      const product = data.products.find((item) => item.id === line.productId)
      return product ? [{ name: product.name, quantity: line.quantity, price: product.price, emoji: product.emoji, image: product.image }] : []
    })
    const total = orderLines.reduce((sum, line) => {
      const product = data.products.find((item) => item.id === line.productId)
      return sum + (product?.price ?? 0) * line.quantity
    }, 0)
    const order: Order = {
      id: `FP-${Math.floor(3000 + Math.random() * 6999)}`,
      customer: details.customer,
      phone: details.phone,
      address: details.address,
      items,
      total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }

    setData((current) => {
      const existingCustomer = current.customers.find((item) => item.phone === details.phone)
      const customer: Customer = existingCustomer ?? {
        id: `c-${Date.now()}`,
        name: details.customer,
        username: details.customer.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        phone: details.phone,
        email: '',
        joinedAt: new Date().toISOString(),
      }
      return {
        ...current,
        orders: [order, ...current.orders],
        customers: existingCustomer ? current.customers : [customer, ...current.customers],
        cart: [],
      }
    })

    return order
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === orderId ? { ...order, status } : order),
    }))
  }

  async function saveProduct(product: Product) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await sessionHeaders() },
      body: JSON.stringify(product),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string }
      throw new Error(payload.error ?? 'We could not save the product. Please try again.')
    }
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
      headers: await sessionHeaders(),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string }
      throw new Error(payload.error ?? 'We could not delete the product. Please try again.')
    }
    setData((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== productId),
      cart: current.cart.filter((line) => line.productId !== productId),
    }))
  }

  const value: DataContextValue = {
    ...data,
    cartCount,
    cartTotal,
    addToCart,
    setCartQuantity,
    clearCart,
    placeOrder,
    updateOrderStatus,
    saveProduct,
    deleteProduct,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
