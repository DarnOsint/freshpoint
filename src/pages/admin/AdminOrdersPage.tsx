import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { useData } from '../../lib/data-store'
import { formatDate, formatMoney } from '../../lib/format'
import type { OrderStatus } from '../../lib/types'

const statuses: Array<'All' | OrderStatus> = ['All', 'Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled']

export function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useData()
  const [filter, setFilter] = useState<'All' | OrderStatus>('All')
  const visible = filter === 'All' ? orders : orders.filter((order) => order.status === filter)

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Order management</p>
          <h1>Orders</h1>
          <p>Update order status as your team prepares and delivers each order.</p>
        </div>
      </header>

      <div className="filter-chips" role="group" aria-label="Filter orders by status">
        {statuses.map((status) => (
          <button key={status} type="button"
            className={`filter-chip${filter === status ? ' filter-chip--active' : ''}`}
            onClick={() => setFilter(status)}>
            {status}
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="admin-order-list admin-order-list--large">
          {visible.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <div className="admin-order-card__head">
                <div><strong>{order.id}</strong><small>{formatDate(order.createdAt)}</small></div>
                <StatusBadge status={order.status} />
              </div>
              <div className="admin-order-card__customer">
                <strong>{order.customer}</strong>
                <span>{order.phone}</span>
                <span>{order.address}</span>
              </div>
              <div className="admin-order-card__items">
                {order.items.map((item, index) => (
                  <div key={`${item.name}-${index}`}><span>{item.emoji} {item.name} ×{item.quantity}</span><strong>{formatMoney(item.price * item.quantity)}</strong></div>
                ))}
              </div>
              <div className="admin-order-card__foot">
                <strong>{formatMoney(order.total)}</strong>
                <label className="status-select">
                  <span>Status</span>
                  <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}>
                    {statuses.slice(1).map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ClipboardList size={28} />
          <h3>No orders here</h3>
          <p>Orders with this status will appear here.</p>
        </div>
      )}
    </div>
  )
}
