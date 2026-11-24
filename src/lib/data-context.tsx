import { useEffect, useState, type ReactNode } from 'react'
import { demoCustomers, demoOrders, demoProducts } from './demo-data'
import { DataContext, type DataContextValue, type StoredData } from './data-store'
import { supabase } from './supabase'
import type { Customer, Order, OrderStatus, Product } from './types'

const STORAGE_KEY = 'freshpoint-data-v1'

async function sessionHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
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
          cart: Array.isArray(parsed.cart) ? parsed.cart : [],
        }
      }
    }
  } catch {
    // Fall through to the seeded catalogue.
  }
  return { products: demoProducts, orders: demoOrders, customers: demoCustomers, cart: [] }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoredData>(loadData)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Storage can be unavailable in private browsing; the app still works in memory.
    }
  }, [data])

  useEffect(() => {
    let active = true
    fetch('/api/products', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((rows: unknown) => {
        if (active && Array.isArray(rows)) setData((current) => ({ ...current, products: rows as Product[] }))
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
    setData((current) => ({
      ...current,
      cart: quantity <= 0
        ? current.cart.filter((line) => line.productId !== productId)
        : current.cart.map((line) => line.productId === productId ? { ...line, quantity } : line),
    }))
  }

  function clearCart() {
    setData((current) => ({ ...current, cart: [] }))
  }

  function placeOrder(details: { customer: string; phone: string; address: string }) {
    const items = data.cart.flatMap((line) => {
      const product = data.products.find((item) => item.id === line.productId)
      return product ? [{ name: product.name, quantity: line.quantity, price: product.price, emoji: product.emoji, image: product.image }] : []
    })
    const order: Order = {
      id: `FP-${Math.floor(3000 + Math.random() * 6999)}`,
      customer: details.customer,
      phone: details.phone,
      address: details.address,
      items,
      total: cartTotal,
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
        accountType: 'household',
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
    setData((current) => ({
      ...current,
      products: current.products.some((item) => item.id === saved.id)
        ? current.products.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current.products],
    }))
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
