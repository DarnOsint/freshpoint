import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Package, Plus, TrendingUp, UsersRound } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { useData } from '../../lib/data-store'
import { formatDate, formatMoney } from '../../lib/format'

export function AdminDashboardPage() {
  const { orders, products, customers } = useData()
  const pending = orders.filter((order) => order.status === 'Pending').length
  const revenue = orders.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + order.total, 0)
  const lowStock = products.filter((product) => product.stock <= 12)
  const recent = orders.slice(0, 5)

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Good day, admin</h1>
          <p>Here’s what’s happening across FreshPoint today.</p>
        </div>
        <Link to="/admin/orders" className="btn btn--primary btn--small">View orders <ArrowRight size={16} /></Link>
      </header>

      <div className="stat-grid stat-grid--admin">
        <div className="stat-card"><span><ClipboardList size={19} /></span><strong>{orders.length}</strong><small>Total orders</small></div>
        <div className="stat-card"><span><TrendingUp size={19} /></span><strong>{formatMoney(revenue)}</strong><small>Order value</small></div>
        <div className="stat-card"><span><UsersRound size={19} /></span><strong>{customers.length}</strong><small>Customers</small></div>
        <div className="stat-card"><span><Package size={19} /></span><strong>{pending}</strong><small>Pending orders</small></div>
      </div>

      <div className="admin-columns">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders" className="text-link">All orders <ArrowRight size={15} /></Link>
          </div>
          <div className="admin-order-list">
            {recent.map((order) => (
              <div className="admin-order-row" key={order.id}>
                <div><strong>{order.id}</strong><small>{order.customer} · {formatDate(order.createdAt)}</small></div>
                <StatusBadge status={order.status} />
                <strong>{formatMoney(order.total)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head"><h2>Low stock</h2><Link to="/admin/products" className="text-link">Products <ArrowRight size={15} /></Link></div>
          {lowStock.length ? (
            <div className="admin-order-list">
              {lowStock.map((product) => (
                <div className="admin-order-row" key={product.id}>
                  <div><strong>{product.emoji} {product.name}</strong><small>{product.category}</small></div>
                  <span className="stock-pill">{product.stock} left</span>
                </div>
              ))}
            </div>
          ) : <p className="admin-muted">All products are well stocked.</p>}
        </section>
      </div>

      <section className="app-section">
        <div className="app-section__head"><h2>Quick actions</h2></div>
        <div className="quick-grid">
          <Link to="/admin/orders" className="quick-card"><ClipboardList size={22} /><strong>Review pending orders</strong><small>{pending} waiting to be prepared</small></Link>
          <Link to="/admin/products" className="quick-card"><Plus size={22} /><strong>Add a product</strong><small>Update the fresh catalogue</small></Link>
          <Link to="/admin/customers" className="quick-card"><UsersRound size={22} /><strong>View customers</strong><small>{customers.length} registered buyers</small></Link>
        </div>
      </section>
    </div>
  )
}
