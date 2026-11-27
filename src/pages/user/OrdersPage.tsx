import { Link } from 'react-router-dom'
import { ArrowRight, PackageCheck } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { useData } from '../../lib/data-store'
import { formatDate, formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function OrdersPage() {
  const { orders } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.orders
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
            <article className="order-card order-card--full" key={order.id}>
              <div className="order-card__top">
                <div><strong>{order.id}</strong><small>{formatDate(order.createdAt)}</small></div>
                <StatusBadge status={order.status} />
              </div>
              <div className="order-card__lines">
                {order.items.map((item, index) => (
                  <div key={`${item.name}-${index}`}><span>{item.emoji} {item.name} ×{item.quantity}</span><span>{formatMoney(item.price * item.quantity)}</span></div>
                ))}
              </div>
              <div className="order-card__bottom"><span>{order.address}</span><strong>{formatMoney(order.total)}</strong></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <PackageCheck size={30} />
          <h3>{copy.emptyHeading}</h3>
          <p>{copy.emptyBody}</p>
          <Link to="/app" className="btn btn--primary btn--small">{copy.browseProduce} <ArrowRight size={16} /></Link>
        </div>
      )}
    </div>
  )
}
