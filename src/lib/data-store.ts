import { createContext, useContext } from 'react'
import type { CartLine, Customer, Order, OrderStatus, Product } from './types'

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
  placeOrder: (details: { customer: string; phone: string; address: string }) => Order
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  saveProduct: (product: Product) => void
}

export const DataContext = createContext<DataContextValue | null>(null)

export function useData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}
