import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Leaf, PackageCheck, ShoppingBasket, Store, Truck } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { firstName, formatDate, formatMoney } from '../../lib/format'

const accountTypeLabels: Record<string, string> = {
  household: 'Household',
  retailer: 'Retail shop',
  restaurant: 'Restaurant / Hotel',
  wholesale: 'Wholesale buyer',
}

export function DashboardPage() {
  const { user } = useAuth()
  const { orders, products, cartCount } = useData()
  const name = firstName((user?.user_metadata?.full_name as string | undefined) ?? 'there')
  const accountType = (user?.user_metadata?.account_type as string | undefined) ?? 'household'
  const myOrders = orders.filter((order) => !user?.phone || order.phone === user.phone)
  const recent = myOrders.slice(0, 3)

  return (
    <div className="app-page">
      <header className="app-page__head">
        <div>
          <p className="eyebrow">Your dashboard</p>
          <h1>Welcome, {name} 👋</h1>
          <p>Fresh produce, ordered simply and delivered to your door.</p>
        </div>
        <span className="account-chip">{accountTypeLabels[accountType] ?? accountType}</span>
      </header>

      <section className="app-banner">
        <span className="app-banner__icon"><Leaf size={25} /></span>
        <div>
          <h2>Fresh picks are ready</h2>
          <p>Browse vegetables, fruits, grains and everyday essentials.</p>
        </div>
        <Link to="/app/shop" className="btn btn--light">Shop now <ArrowRight size={17} /></Link>
      </section>

      <div className="stat-grid">
        <div className="stat-card">
          <span><ClipboardList size={19} /></span>
          <strong>{myOrders.length}</strong>
          <small>Orders placed</small>
        </div>
        <div className="stat-card">
          <span><ShoppingBasket size={19} /></span>
          <strong>{cartCount}</strong>
          <small>Items in basket</small>
        </div>
        <div className="stat-card">
          <span><Store size={19} /></span>
          <strong>{products.length}</strong>
          <small>Products available</small>
        </div>
      </div>

      <section className="app-section">
        <div className="app-section__head">
          <h2>Quick actions</h2>
        </div>
        <div className="quick-grid">
          <Link to="/app/shop" className="quick-card"><ShoppingBasket size={22} /><strong>Browse produce</strong><small>Find today’s fresh picks</small></Link>
          <Link to="/app/orders" className="quick-card"><PackageCheck size={22} /><strong>Track orders</strong><small>See your order history</small></Link>
          <Link to="/app/account" className="quick-card"><Truck size={22} /><strong>Delivery details</strong><small>Keep your contact info current</small></Link>
        </div>
      </section>

      <section className="app-section">
        <div className="app-section__head">
          <h2>Recent orders</h2>
          <Link to="/app/orders" className="text-link">View all <ArrowRight size={15} /></Link>
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
                <div className="order-card__bottom"><span>{order.items.length} item{order.items.length === 1 ? '' : 's'}</span><strong>{formatMoney(order.total)}</strong></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PackageCheck size={28} />
            <h3>No orders yet</h3>
            <p>When you place an order it will appear here.</p>
            <Link to="/app/shop" className="btn btn--primary btn--small">Start shopping</Link>
          </div>
        )}
      </section>
    </div>
  )
}
