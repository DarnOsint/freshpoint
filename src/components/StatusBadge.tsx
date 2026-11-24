import type { OrderStatus } from '../lib/types'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = status.toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-badge status-badge--${tone}`}>{status}</span>
}
