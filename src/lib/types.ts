export type AccountType = 'household' | 'retailer' | 'restaurant' | 'wholesale'

export type OrderStatus = 'Pending' | 'Preparing' | 'Out for delivery' | 'Delivered' | 'Cancelled'

export type Product = {
  id: string
  name: string
  category: string
  price: number
  unit: string
  emoji: string
  tone: 'red' | 'orange' | 'brown' | 'green' | 'amber' | 'teal'
  stock: number
  /** Cloudflare R2 object key (or full URL). Empty falls back to the emoji tile. */
  image?: string | null
}

export type CartLine = { productId: string; quantity: number }

export type OrderLine = {
  name: string
  quantity: number
  price: number
  emoji: string
  image?: string | null
}

export type Order = {
  id: string
  customer: string
  phone: string
  address: string
  items: OrderLine[]
  total: number
  status: OrderStatus
  createdAt: string
}

export type Customer = {
  id: string
  name: string
  username: string
  phone: string
  email: string
  accountType: AccountType
  joinedAt: string
}
