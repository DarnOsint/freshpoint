import { createContext, useContext } from 'react'
import type { CartLine, Customer, Order, OrderStatus, Product, Role } from './types'

export type StoredData = {
  products: Product[]
  orders: Order[]
  customers: Customer[]
  cart: CartLine[]
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
  refreshOrders: () => Promise<void>
  saveProduct: (product: Product) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
}

export const DataContext = createContext<DataContextValue | null>(null)

export function useData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}
