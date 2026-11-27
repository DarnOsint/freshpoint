import type { Customer, Order, Product } from './types'

export const categories = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Tubers',
  'Cooking essentials',
]

export const demoProducts: Product[] = [
  { id: 'p-tomatoes', name: 'Tomatoes', category: 'Vegetables', price: 800, unit: 'per kg', emoji: '🍅', tone: 'red', stock: 120 },
  { id: 'p-mangoes', name: 'Mangoes', category: 'Fruits', price: 1200, unit: 'per kg', emoji: '🥭', tone: 'orange', stock: 64 },
  { id: 'p-potatoes', name: 'Irish potatoes', category: 'Tubers', price: 600, unit: 'per kg', emoji: '🥔', tone: 'brown', stock: 210 },
  { id: 'p-cabbage', name: 'Cabbage', category: 'Vegetables', price: 500, unit: 'per head', emoji: '🥬', tone: 'green', stock: 8 },
  { id: 'p-bananas', name: 'Bananas', category: 'Fruits', price: 700, unit: 'per kg', emoji: '🍌', tone: 'amber', stock: 95 },
  { id: 'p-beans', name: 'Beans', category: 'Grains', price: 1500, unit: 'per kg', emoji: '🫘', tone: 'teal', stock: 42 },
  { id: 'p-carrots', name: 'Carrots', category: 'Vegetables', price: 900, unit: 'per kg', emoji: '🥕', tone: 'orange', stock: 11 },
  { id: 'p-groundnuts', name: 'Groundnuts', category: 'Cooking essentials', price: 1800, unit: 'per kg', emoji: '🥜', tone: 'brown', stock: 58 },
  { id: 'p-onions', name: 'Onions', category: 'Vegetables', price: 750, unit: 'per kg', emoji: '🧅', tone: 'amber', stock: 140 },
  { id: 'p-rice', name: 'Rice', category: 'Grains', price: 2200, unit: 'per 5 kg', emoji: '🍚', tone: 'teal', stock: 76 },
]

export const demoOrders: Order[] = [
  {
    id: 'FP-2041',
    customer: 'Mary Achol',
    phone: '+211900123456',
    address: 'Juba, near Market Street',
    items: [
      { name: 'Tomatoes', quantity: 3, price: 800, emoji: '🍅' },
      { name: 'Onions', quantity: 2, price: 750, emoji: '🧅' },
    ],
    total: 3900,
    status: 'Out for delivery',
    createdAt: '2026-11-23T09:20:00.000Z',
  },
  {
    id: 'FP-2040',
    customer: 'Daniel Garang',
    phone: '+211900234567',
    address: 'Juba, Thonpang',
    items: [
      { name: 'Mangoes', quantity: 5, price: 1200, emoji: '🥭' },
      { name: 'Bananas', quantity: 2, price: 700, emoji: '🍌' },
    ],
    total: 7400,
    status: 'Preparing',
    createdAt: '2026-11-22T14:05:00.000Z',
  },
  {
    id: 'FP-2039',
    customer: 'Mary Achol',
    phone: '+211900123456',
    address: 'Juba, near Market Street',
    items: [
      { name: 'Cabbage', quantity: 2, price: 500, emoji: '🥬' },
      { name: 'Carrots', quantity: 1, price: 900, emoji: '🥕' },
    ],
    total: 1900,
    status: 'Delivered',
    createdAt: '2026-11-18T08:40:00.000Z',
  },
  {
    id: 'FP-2038',
    customer: 'Grace Nyang',
    phone: '+211900345678',
    address: 'Juba, Konyo Konyo',
    items: [{ name: 'Rice', quantity: 3, price: 2200, emoji: '🍚' }],
    total: 6600,
    status: 'Pending',
    createdAt: '2026-11-24T07:15:00.000Z',
  },
]

export const demoCustomers: Customer[] = [
  { id: 'c-1', name: 'Mary Achol', username: 'mary_achol', phone: '+211900123456', email: 'mary@example.com', joinedAt: '2026-10-12T10:00:00.000Z' },
  { id: 'c-2', name: 'Daniel Garang', username: 'daniel_g', phone: '+211900234567', email: 'daniel@example.com', joinedAt: '2026-10-20T11:30:00.000Z' },
  { id: 'c-3', name: 'Grace Nyang', username: 'grace_n', phone: '+211900345678', email: 'grace@example.com', joinedAt: '2026-11-02T09:10:00.000Z' },
  { id: 'c-4', name: 'John Deng', username: 'john_deng', phone: '+211900456789', email: 'john@example.com', joinedAt: '2026-11-14T16:45:00.000Z' },
]
