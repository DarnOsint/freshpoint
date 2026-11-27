import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SheetCloseButton } from '../../components/SheetCloseButton'
import { StatusBadge } from '../../components/StatusBadge'
import { useData } from '../../lib/data-store'
import { formatDate, formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'
import { useSheetDismiss } from '../../lib/use-sheet-dismiss'

export function OrdersPage() {
  const { orders, trackEvent } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.orders
  const [params] = useSearchParams()
  const focusedOrder = params.get('order')
  const [openedId, setOpenedId] = useState('')
  const selectedId = focusedOrder || openedId

  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const selected = selectedId ? sorted.find((order) => order.id === selectedId) ?? null : null
  const trackedOrderRef = useRef('')

  useEffect(() => {
    if (!selected) {
      trackedOrderRef.current = ''
      return
    }
    const key = `${selected.id}:${selected.createdAt}`
    if (trackedOrderRef.current === key) return
    trackedOrderRef.current = key
    trackEvent({
      action: 'order.view',
      targetType: 'order',
      targetId: selected.id,
      details: { status: selected.status, value: selected.total },
    })
  }, [selected, trackEvent])

  function closeOrder() {
    setOpenedId('')
    if (focusedOrder) window.history.replaceState(null, '', '/app/orders')
  }

  useSheetDismiss(Boolean(selected), closeOrder)

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.heading}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>

      {sorted.length ? (
        <div className="order-list">
          {sorted.map((order) => (
            <article
              className={`order-row${selectedId === order.id ? ' order-card--focused' : ''}`}
              data-order-id={order.id}
              key={order.id}
            >
              <button type="button" className="order-row__open" onClick={() => setOpenedId(order.id)} aria-label={`Open order ${order.id}`}>
                <span className="order-row__main">
                  <strong>{order.id}</strong>
                  <small>{formatDate(order.createdAt)}</small>
                </span>
                <StatusBadge status={order.status} />
                <strong className="order-row__total">{formatMoney(order.total)}</strong>
                <svg className="order-row__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>{copy.emptyHeading}</h3>
          <p>{copy.emptyBody}</p>
          <Link to="/app" className="btn btn--primary btn--small">{copy.browseProduce}</Link>
        </div>
      )}

      {selected ? (
        <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeOrder() }}>
          <div className="order-sheet" role="dialog" aria-modal="true" aria-labelledby="customer-order-sheet-title">
            <div className="order-sheet__head">
              <div>
                <p className="eyebrow">Order details</p>
                <h2 id="customer-order-sheet-title">{selected.id}</h2>
                <small>Placed {formatDate(selected.createdAt)}</small>
              </div>
              <SheetCloseButton label="Close order details" onClick={closeOrder} />
            </div>

            <div className="order-sheet__status">
              <StatusBadge status={selected.status} />
              <strong>{formatMoney(selected.total)}</strong>
            </div>

            <div className="order-sheet__block">
              <h3>Delivery</h3>
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
          </div>
        </div>
      ) : null}
    </div>
  )
}
