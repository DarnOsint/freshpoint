import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Leaf, PackageCheck, ShoppingBasket, Store, Truck } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { firstName, formatDate, formatMoney } from '../../lib/format'
import { useSiteSettings } from '../../lib/site-content'

export function DashboardPage() {
  const { user } = useAuth()
  const { orders, products, cartCount } = useData()
  const { settings } = useSiteSettings()
  const copy = settings.interface.app.dashboard
  const name = firstName((user?.user_metadata?.full_name as string | undefined) ?? settings.interface.common.customerFallback)
  const myOrders = orders.filter((order) => !user?.phone || order.phone === user.phone)
  const recent = myOrders.slice(0, 3)

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.welcome.replace('{name}', name)}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>

      <section className="app-banner">
        <span className="app-banner__icon"><Leaf size={25} /></span>
        <div>
          <h2>{copy.bannerTitle}</h2>
          <p>{copy.bannerText}</p>
        </div>
        <Link to="/app/shop" className="btn btn--light">{copy.bannerCta} <ArrowRight size={17} /></Link>
      </section>

      <div className="stat-grid">
        <div className="stat-card">
          <span><ClipboardList size={19} /></span>
          <strong>{myOrders.length}</strong>
          <small>{copy.ordersPlaced}</small>
        </div>
        <div className="stat-card">
          <span><ShoppingBasket size={19} /></span>
          <strong>{cartCount}</strong>
          <small>{copy.itemsInBasket}</small>
        </div>
        <div className="stat-card">
          <span><Store size={19} /></span>
          <strong>{products.length}</strong>
          <small>{copy.productsAvailable}</small>
        </div>
      </div>

      <section className="app-section">
        <div className="app-section__head">
          <h2>{copy.quickActions}</h2>
        </div>
        <div className="quick-grid">
          <Link to="/app/shop" className="quick-card"><ShoppingBasket size={22} /><strong>{copy.browseProduce}</strong><small>{copy.browseProduceHint}</small></Link>
          <Link to="/app/orders" className="quick-card"><PackageCheck size={22} /><strong>{copy.trackOrders}</strong><small>{copy.trackOrdersHint}</small></Link>
          <Link to="/app/account" className="quick-card"><Truck size={22} /><strong>{copy.deliveryDetails}</strong><small>{copy.deliveryDetailsHint}</small></Link>
        </div>
      </section>

      <section className="app-section">
        <div className="app-section__head">
          <h2>{copy.recentOrders}</h2>
          <Link to="/app/orders" className="text-link">{copy.viewAll} <ArrowRight size={15} /></Link>
        </div>
        {recent.length ? (
          <div className="order-list">
            {recent.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__top">
                  <div><strong>{order.id}</strong><small>{formatDate(order.createdAt)}</small></div>
                  <StatusBadge status={order.status} />
                </div>
                <p className="order-card__items">{order.items.map((item) => `${item.emoji} ${item.name} ×${item.quantity}`).join('   ')}</p>
                <div className="order-card__bottom"><span>{order.items.length} {order.items.length === 1 ? copy.item : copy.items}</span><strong>{formatMoney(order.total)}</strong></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PackageCheck size={28} />
            <h3>{copy.noOrders}</h3>
            <p>{copy.noOrdersHint}</p>
            <Link to="/app/shop" className="btn btn--primary btn--small">{copy.startShopping}</Link>
          </div>
        )}
      </section>
    </div>
  )
}
