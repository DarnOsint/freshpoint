import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SheetCloseButton } from './SheetCloseButton'
import { StatusBadge } from './StatusBadge'
import { useData } from '../lib/data-store'
import { formatDate, formatMoney } from '../lib/format'
import { useSheetDismiss } from '../lib/use-sheet-dismiss'
import type { OrderStatus } from '../lib/types'

const statuses: Array<'All' | OrderStatus> = ['All', 'Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled']
const statusOptions: OrderStatus[] = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled']

export function OrderWorkspace({ manager = false }: { manager?: boolean }) {
  const { orders, updateOrderStatus } = useData()
  const [filter, setFilter] = useState<'All' | OrderStatus>('All')
  const [params, setParams] = useSearchParams()
  const [openedId, setOpenedId] = useState('')
  const selectedId = params.get('order') || openedId
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const visible = filter === 'All' ? sorted : sorted.filter((order) => order.status === filter)
  const selected = selectedId ? orders.find((order) => order.id === selectedId) ?? null : null
  const countFor = (status: 'All' | OrderStatus) => status === 'All'
    ? orders.length
    : orders.filter((order) => order.status === status).length

  function openOrder(orderId: string) {
    setOpenedId(orderId)
    setError('')
    setNotice('')
  }

  function closeOrder() {
    setOpenedId('')
    if (params.has('order')) {
      const next = new URLSearchParams(params)
      next.delete('order')
      setParams(next, { replace: true })
    }
    setError('')
    setNotice('')
  }

  useSheetDismiss(Boolean(selected), closeOrder)

  async function changeStatus(orderId: string, status: OrderStatus) {
    if (busyId) return
    setError('')
    setNotice('')
    setBusyId(orderId)
    try {
      await updateOrderStatus(orderId, status)
      setNotice(`${orderId} updated to ${status}.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not update this order. Please try again.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="admin-page order-workspace">
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
        <span className="admin-count-chip">{orders.length} order{orders.length === 1 ? '' : 's'}</span>
      </header>

      {error && !selected ? <p className="field-error admin-inline-error">{error}</p> : null}
      {notice && !selected ? <p className="profile-success">{notice}</p> : null}

      <div className="order-summary" aria-label="Order status summary">
        <div className="order-summary__card">
          <span>Pending</span>
          <strong>{countFor('Pending')}</strong>
          <small>Need attention</small>
        </div>
        <div className="order-summary__card">
          <span>Preparing</span>
          <strong>{countFor('Preparing')}</strong>
          <small>Being packed</small>
        </div>
        <div className="order-summary__card">
          <span>On the way</span>
          <strong>{countFor('Out for delivery')}</strong>
          <small>With the rider</small>
        </div>
      </div>

      <div className="order-filters" role="group" aria-label="Filter orders by status">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            className={`order-filter${filter === status ? ' order-filter--active' : ''}`}
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
          >
            <span>{status}</span>
            <strong>{countFor(status)}</strong>
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="order-queue">
          {visible.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
            const active = order.status !== 'Delivered' && order.status !== 'Cancelled'
            return (
              <article className="order-queue__row" key={order.id}>
                <button
                  type="button"
                  className="order-queue__open"
                  onClick={() => openOrder(order.id)}
                  aria-label={`Open order ${order.id}`}
                >
                  <span className="order-queue__main">
                    <strong>{order.id}</strong>
                    <small>{order.customer} · {formatDate(order.createdAt)} · {itemCount} item{itemCount === 1 ? '' : 's'}</small>
                  </span>
                  <StatusBadge status={order.status} />
                  <strong className="order-queue__total">{formatMoney(order.total)}</strong>
                </button>
                {manager && active ? (
                  <button
                    type="button"
                    className="order-queue__action"
                    aria-label="Mark fulfilled"
                    title="Mark fulfilled"
                    disabled={busyId === order.id}
                    onClick={() => void changeStatus(order.id, 'Delivered')}
                  >
                    Fulfil
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No orders here</h3>
          <p>Orders with this status will appear here.</p>
        </div>
      )}

      {selected ? (
        <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeOrder() }}>
          <div className="order-sheet" role="dialog" aria-modal="true" aria-labelledby="order-sheet-title">
            <div className="order-sheet__head">
              <div>
                <p className="eyebrow">Order details</p>
                <h2 id="order-sheet-title">{selected.id}</h2>
                <small>Placed {formatDate(selected.createdAt)}</small>
              </div>
              <SheetCloseButton label="Close order details" onClick={closeOrder} />
            </div>

            <div className="order-sheet__status">
              <StatusBadge status={selected.status} />
              <strong>{formatMoney(selected.total)}</strong>
            </div>

            <div className="order-sheet__block">
              <h3>Customer</h3>
              <div className="order-sheet__detail">
                <div><strong>{selected.customer}</strong><small>Delivery contact</small></div>
              </div>
              <div className="order-sheet__detail">
                <div><strong>{selected.phone}</strong><small>Phone number</small></div>
              </div>
              <div className="order-sheet__detail">
                <div><strong>{selected.address}</strong><small>Delivery address</small></div>
              </div>
            </div>

            <div className="order-sheet__block">
              <h3>Items</h3>
              <div className="order-sheet__items">
                {selected.items.map((item, index) => (
                  <div key={`${item.name}-${index}`}>
                    <span>{item.name} ×{item.quantity}</span>
                    <strong>{formatMoney(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="order-sheet__total"><span>Total</span><strong>{formatMoney(selected.total)}</strong></div>
            </div>

            <div className="order-sheet__block">
              <h3>Update status</h3>
              <div className="status-actions" role="group" aria-label="Update order status">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`status-action${selected.status === status ? ' status-action--active' : ''}`}
                    disabled={busyId === selected.id}
                    onClick={() => void changeStatus(selected.id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
              {manager && selected.status !== 'Delivered' && selected.status !== 'Cancelled' ? (
                <button
                  type="button"
                  className="btn btn--primary btn--block btn--large order-sheet__fulfil"
                  disabled={busyId === selected.id}
                  onClick={() => void changeStatus(selected.id, 'Delivered')}
                >
                  Mark fulfilled
                </button>
              ) : null}
            </div>

            {error ? <p className="field-error admin-inline-error">{error}</p> : null}
            {notice ? <p className="profile-success">{notice}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
