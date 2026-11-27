import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StatusBadge } from '../../components/StatusBadge'
import { useData } from '../../lib/data-store'
import { formatDate, formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function OrdersPage() {
  const { orders } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.orders
  const [params] = useSearchParams()
  const focusedOrder = params.get('order')

  useEffect(() => {
    if (!focusedOrder) return
    const target = Array.from(document.querySelectorAll<HTMLElement>('[data-order-id]'))
      .find((element) => element.dataset.orderId === focusedOrder)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusedOrder, orders.length])

  const mine = orders

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.heading}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>

      {mine.length ? (
        <div className="order-list">
          {mine.map((order) => (
            <article
              className={`order-card order-card--full${focusedOrder === order.id ? ' order-card--focused' : ''}`}
              data-order-id={order.id}
              key={order.id}
            >
              <div className="order-card__top">
                <div><strong>{order.id}</strong><small>{formatDate(order.createdAt)}</small></div>
                <StatusBadge status={order.status} />
              </div>
              <div className="order-card__lines">
                {order.items.map((item, index) => (
                  <div key={`${item.name}-${index}`}><span>{item.name} ×{item.quantity}</span><span>{formatMoney(item.price * item.quantity)}</span></div>
                ))}
              </div>
              <div className="order-card__bottom"><span>{order.address}</span><strong>{formatMoney(order.total)}</strong></div>
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
    </div>
  )
}
