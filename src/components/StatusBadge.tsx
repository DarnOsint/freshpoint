import { useSiteSettings } from '../lib/site-content'
import type { OrderStatus } from '../lib/types'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { settings } = useSiteSettings()
  const tone = status.toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-badge status-badge--${tone}`}>{settings.interface.app.statuses[status] ?? status}</span>
}
