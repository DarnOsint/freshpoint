import { Link } from 'react-router-dom'
import { ArrowRight, PackageCheck } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { formatDate, formatMoney } from '../../lib/format'

export function OrdersPage() {
  const { user } = useAuth()
  const { orders } = useData()
  const mine = orders.filter((order) => !user?.phone || order.phone === user.phone)

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div>
          <p className="eyebrow">Order history</p>
          <h1>My orders</h1>
          <p>Follow your orders from placement to delivery.</p>
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
          <h3>No orders yet</h3>
          <p>Your orders will show up here once you place one.</p>
          <Link to="/app/shop" className="btn btn--primary btn--small">Browse produce <ArrowRight size={16} /></Link>
        </div>
      )}
    </div>
  )
}
