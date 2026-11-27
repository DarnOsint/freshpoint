import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Truck, UsersRound } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { useData } from '../../lib/data-store'
import { formatDate, formatMoney } from '../../lib/format'

export function ManagerDashboardPage() {
  const { orders, customers } = useData()
  const pending = orders.filter((order) => order.status === 'Pending').length
  const inProgress = orders.filter((order) => order.status === 'Preparing' || order.status === 'Out for delivery').length
  const revenue = orders.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Manager console</p>
          <h1>Incoming orders</h1>
          <p>Track what needs attention and keep each order moving.</p>
        </div>
        <Link to="/manager/orders" className="btn btn--primary btn--small">View orders <ArrowRight size={16} /></Link>
      </header>

      <div className="stat-grid stat-grid--admin">
        <div className="stat-card"><span><ClipboardList size={19} /></span><strong>{pending}</strong><small>New orders</small></div>
        <div className="stat-card"><span><Truck size={19} /></span><strong>{inProgress}</strong><small>In progress</small></div>
        <div className="stat-card"><span><ClipboardList size={19} /></span><strong>{orders.length}</strong><small>Total orders</small></div>
        <div className="stat-card"><span><UsersRound size={19} /></span><strong>{formatMoney(revenue)}</strong><small>Order value</small></div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Latest orders</h2>
          <Link to="/manager/orders" className="text-link">All orders <ArrowRight size={15} /></Link>
        </div>
        {orders.length ? (
          <div className="admin-order-list">
            {orders.slice(0, 5).map((order) => (
              <div className="admin-order-row" key={order.id}>
                <div><strong>{order.id}</strong><small>{order.customer} · {formatDate(order.createdAt)}</small></div>
                <StatusBadge status={order.status} />
                <strong>{formatMoney(order.total)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-muted">No orders yet. New customer orders will appear here.</p>
        )}
      </section>

      <section className="app-section">
        <div className="app-section__head"><h2>Quick actions</h2></div>
        <div className="quick-grid">
          <Link to="/manager/orders" className="quick-card"><ClipboardList size={22} /><strong>Review orders</strong><small>{pending} waiting to be prepared</small></Link>
          <Link to="/manager/customers" className="quick-card"><UsersRound size={22} /><strong>View customers</strong><small>{customers.length} registered buyers</small></Link>
        </div>
      </section>
    </div>
  )
}
