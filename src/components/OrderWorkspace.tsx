import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { useData } from '../lib/data-store'
import { formatDate, formatMoney } from '../lib/format'
import type { OrderStatus } from '../lib/types'

const statuses: Array<'All' | OrderStatus> = ['All', 'Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled']

export function OrderWorkspace({ manager = false }: { manager?: boolean }) {
  const { orders, updateOrderStatus } = useData()
  const [filter, setFilter] = useState<'All' | OrderStatus>('All')
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const visible = filter === 'All' ? orders : orders.filter((order) => order.status === filter)

  async function changeStatus(orderId: string, status: OrderStatus) {
    if (busyId) return
    setError('')
    setBusyId(orderId)
    try {
      await updateOrderStatus(orderId, status)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not update this order. Please try again.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">{manager ? 'Incoming orders' : 'Order management'}</p>
          <h1>Orders</h1>
          <p>
            {manager
              ? 'Receive new orders and update them as your team prepares and delivers.'
              : 'Update order status as your team prepares and delivers each order.'}
          </p>
          {manager ? <p className="admin-muted">Marking an order fulfilled sets its status to Delivered.</p> : null}
        </div>
      </header>

      {error ? <p className="field-error admin-inline-error">{error}</p> : null}

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
                  <div key={`${item.name}-${index}`}>
                    <span>{item.emoji} {item.name} ×{item.quantity}</span>
                    <strong>{formatMoney(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="admin-order-card__foot">
                <strong>{formatMoney(order.total)}</strong>
                <div className="admin-order-card__controls">
                  <label className="status-select">
                    <span>Status</span>
                    <select
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(event) => void changeStatus(order.id, event.target.value as OrderStatus)}>
                      {statuses.slice(1).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  {manager && order.status !== 'Delivered' && order.status !== 'Cancelled' ? (
                    <button
                      type="button"
                      className="btn btn--outline btn--small"
                      disabled={busyId === order.id}
                      onClick={() => void changeStatus(order.id, 'Delivered')}>
                      Mark fulfilled
                    </button>
                  ) : null}
                </div>
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
