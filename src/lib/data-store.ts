import { createContext, useContext } from 'react'
import type { ActivityEvent, AppNotification, CartLine, Customer, Order, OrderStatus, Product, Role } from './types'

export type TrackEventInput = {
  action: string
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
}

export type StoredData = {
  products: Product[]
  orders: Order[]
  customers: Customer[]
  cart: CartLine[]
  notifications: AppNotification[]
  events: ActivityEvent[]
}

export type DataContextValue = StoredData & {
  cartCount: number
  cartTotal: number
  addToCart: (productId: string) => void
  setCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  placeOrder: (details: { customer: string; phone: string; address: string }) => Promise<Order>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
  setCustomerRole: (customerId: string, role: Extract<Role, 'manager' | 'customer'>) => Promise<void>
  saveCustomer: (customer: Customer) => Promise<void>
  refreshOrders: () => Promise<void>
  refreshNotifications: () => Promise<void>
  refreshEvents: () => Promise<void>
  trackEvent: (event: TrackEventInput) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  unreadNotificationCount: number
  saveProduct: (product: Product) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
}

export const DataContext = createContext<DataContextValue | null>(null)

export function useData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}
