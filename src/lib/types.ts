export type Role = 'admin' | 'manager' | 'customer'

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
  /** Cloudflare R2 object key (or full URL) for the product photo. */
  image?: string | null
  /** Hidden products stay in the catalogue but disappear from the shop and landing page. */
  active?: boolean
}

export type CartLine = { productId: string; quantity: number }

export type OrderLine = {
  name: string
  quantity: number
  price: number
  emoji: string
  image?: string | null
  productId?: string | null
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

export type AppNotification = {
  id: string
  title: string
  body: string
  orderId: string
  status: string
  createdAt: string
  read?: boolean
}

export type ActivityEvent = {
  id: string
  createdAt: string
  actorId: string
  actorEmail: string
  actorRole: Role
  action: string
  targetType: string
  targetId: string
  details: Record<string, unknown>
}

export type Customer = {
  id: string
  name: string
  username: string
  phone: string
  address?: string
  email: string
  joinedAt: string
  role?: Role
}
