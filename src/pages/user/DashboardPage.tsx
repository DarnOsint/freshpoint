import { Link } from 'react-router-dom'
import { ProductCatalogue } from '../../components/ProductCatalogue'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { firstName, formatDate, formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function DashboardPage() {
  const { user } = useAuth()
  const { orders } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.dashboard
  const name = firstName((user?.user_metadata?.full_name as string | undefined) ?? settings.interface.common.customerFallback)
  const recent = orders.slice(0, 3)

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.welcome.replace('{name}', name)}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>

      <section className="app-section">
        <div className="app-section__head">
          <h2>{copy.catalogueTitle}</h2>
        </div>
        <p className="section-hint">{copy.catalogueIntro}</p>
        <ProductCatalogue />
      </section>

      {recent.length ? (
        <section className="app-section">
          <div className="app-section__head">
            <h2>{copy.recentOrders}</h2>
            <Link to="/app/orders" className="text-link">{copy.viewAll}</Link>
          </div>
          <div className="order-list">
            {recent.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__top">
                  <div><strong>{order.id}</strong><small>{formatDate(order.createdAt)}</small></div>
                  <StatusBadge status={order.status} />
                </div>
                <p className="order-card__items">{order.items.map((item) => `${item.name} ×${item.quantity}`).join('   ')}</p>
                <div className="order-card__bottom"><span>{order.items.length} {order.items.length === 1 ? copy.item : copy.items}</span><strong>{formatMoney(order.total)}</strong></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
