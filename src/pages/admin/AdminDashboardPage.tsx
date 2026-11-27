import { Link } from 'react-router-dom'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'

const statuses = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'] as const

function dayKey(value: string) {
  return value.slice(0, 10)
}

export function AdminDashboardPage() {
  const { orders, products, customers } = useData()
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const billable = sorted.filter((order) => order.status !== 'Cancelled')
  const delivered = billable.filter((order) => order.status === 'Delivered')
  const revenue = billable.reduce((sum, order) => sum + order.total, 0)
  const average = billable.length ? revenue / billable.length : 0
  const pending = sorted.filter((order) => order.status === 'Pending').length
  const lowStock = products.filter((product) => product.stock <= 12)

  const daily = new Map<string, { orders: number; delivered: number; revenue: number }>()
  for (const order of sorted) {
    const key = dayKey(order.createdAt)
    const row = daily.get(key) ?? { orders: 0, delivered: 0, revenue: 0 }
    row.orders += 1
    if (order.status === 'Delivered') row.delivered += 1
    if (order.status !== 'Cancelled') row.revenue += order.total
    daily.set(key, row)
  }
  const trend = [...daily.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 7)

  const productStats = new Map<string, { name: string; units: number; revenue: number }>()
  for (const order of billable) {
    for (const item of order.items) {
      const key = item.productId || item.name
      const row = productStats.get(key) ?? { name: item.name, units: 0, revenue: 0 }
      row.units += item.quantity
      row.revenue += item.price * item.quantity
      productStats.set(key, row)
    }
  }
  const topProducts = [...productStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6)

  const customerStats = new Map<string, { name: string; orders: number; spend: number; last: string }>()
  for (const order of billable) {
    const key = order.customer.trim().toLowerCase()
    const row = customerStats.get(key) ?? { name: order.customer, orders: 0, spend: 0, last: order.createdAt }
    row.orders += 1
    row.spend += order.total
    if (order.createdAt > row.last) row.last = order.createdAt
    customerStats.set(key, row)
  }
  const topCustomers = [...customerStats.values()].sort((a, b) => b.spend - a.spend).slice(0, 6)

  const overviewRows = [
    { label: 'Gross order value', value: formatMoney(revenue), detail: 'Excludes cancelled orders' },
    { label: 'Orders placed', value: String(sorted.length), detail: `${delivered.length} delivered` },
    { label: 'Average order value', value: formatMoney(average), detail: 'Across billable orders' },
    { label: 'Fulfilment rate', value: `${billable.length ? Math.round((delivered.length / billable.length) * 100) : 0}%`, detail: 'Delivered ÷ billable orders' },
    { label: 'Orders awaiting action', value: String(pending), detail: 'Pending only' },
    { label: 'Registered customers', value: String(customers.length), detail: `${customerStats.size} with billable orders` },
    { label: 'Catalogue size', value: String(products.length), detail: `${products.filter((product) => product.active !== false).length} active products` },
    { label: 'Inventory value', value: formatMoney(products.reduce((sum, product) => sum + product.price * product.stock, 0)), detail: 'Catalogue price × stock' },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Business overview</h1>
          <p>Sales performance, order flow and inventory health across FreshPoint.</p>
        </div>
        <Link to="/admin/orders" className="btn btn--primary btn--small">Manage orders</Link>
      </header>

      <div className="stat-grid stat-grid--admin">
        <div className="stat-card"><strong>{formatMoney(revenue)}</strong><small>Order value</small></div>
        <div className="stat-card"><strong>{sorted.length}</strong><small>Orders placed</small></div>
        <div className="stat-card"><strong>{formatMoney(average)}</strong><small>Average order</small></div>
        <div className="stat-card"><strong>{pending}</strong><small>Pending orders</small></div>
      </div>

      <section className="admin-panel analytics-panel">
        <div className="admin-panel__head"><h2>Overview</h2><span className="admin-muted">All time</span></div>
        <div className="analytics-scroll">
          <table className="analytics-table">
            <thead><tr><th>Metric</th><th>Value</th><th>Detail</th></tr></thead>
            <tbody>
              {overviewRows.map((row) => (
                <tr key={row.label}><th scope="row">{row.label}</th><td><strong>{row.value}</strong></td><td>{row.detail}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel analytics-panel">
        <div className="admin-panel__head"><h2>Analytics</h2><span className="admin-muted">Latest 7 order days</span></div>
        {trend.length ? (
          <div className="analytics-scroll">
            <table className="analytics-table">
              <thead><tr><th>Date</th><th>Orders</th><th>Delivered</th><th>Revenue</th><th>Avg order</th></tr></thead>
              <tbody>
                {trend.map(([date, row]) => (
                  <tr key={date}>
                    <th scope="row">{date}</th>
                    <td>{row.orders}</td>
                    <td>{row.delivered}</td>
                    <td><strong>{formatMoney(row.revenue)}</strong></td>
                    <td>{formatMoney(row.orders ? row.revenue / row.orders : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="admin-muted">No sales data yet. Placed orders will appear here.</p>}
      </section>

      <div className="admin-columns">
        <section className="admin-panel analytics-panel">
          <div className="admin-panel__head"><h2>Order status</h2></div>
          <div className="analytics-scroll">
            <table className="analytics-table">
              <thead><tr><th>Status</th><th>Orders</th><th>Value</th><th>Share</th></tr></thead>
              <tbody>
                {statuses.map((status) => {
                  const rows = sorted.filter((order) => order.status === status)
                  const value = rows.reduce((sum, order) => sum + order.total, 0)
                  return (
                    <tr key={status}>
                      <th scope="row">{status}</th>
                      <td>{rows.length}</td>
                      <td><strong>{formatMoney(value)}</strong></td>
                      <td>{sorted.length ? Math.round((rows.length / sorted.length) * 100) : 0}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel analytics-panel">
          <div className="admin-panel__head"><h2>Top products</h2><Link to="/admin/products" className="text-link">Catalogue</Link></div>
          {topProducts.length ? (
            <div className="analytics-scroll">
              <table className="analytics-table">
                <thead><tr><th>Product</th><th>Units</th><th>Revenue</th><th>Share</th></tr></thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product.name}>
                      <th scope="row">{product.name}</th>
                      <td>{product.units}</td>
                      <td><strong>{formatMoney(product.revenue)}</strong></td>
                      <td>{revenue ? Math.round((product.revenue / revenue) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-muted">No product sales recorded yet.</p>}
        </section>
      </div>

      <div className="admin-columns">
        <section className="admin-panel analytics-panel">
          <div className="admin-panel__head"><h2>Top customers</h2><Link to="/admin/customers" className="text-link">Customers</Link></div>
          {topCustomers.length ? (
            <div className="analytics-scroll">
              <table className="analytics-table">
                <thead><tr><th>Customer</th><th>Orders</th><th>Spend</th><th>Last order</th></tr></thead>
                <tbody>
                  {topCustomers.map((customer) => (
                    <tr key={customer.name}>
                      <th scope="row">{customer.name}</th>
                      <td>{customer.orders}</td>
                      <td><strong>{formatMoney(customer.spend)}</strong></td>
                      <td>{dayKey(customer.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-muted">No customer spending recorded yet.</p>}
        </section>

        <section className="admin-panel analytics-panel">
          <div className="admin-panel__head"><h2>Inventory health</h2><Link to="/admin/products" className="text-link">Products</Link></div>
          {products.length ? (
            <div className="analytics-scroll">
              <table className="analytics-table">
                <thead><tr><th>Product</th><th>Stock</th><th>Value</th><th>Status</th></tr></thead>
                <tbody>
                  {[...products].sort((a, b) => a.stock - b.stock).slice(0, 6).map((product) => (
                    <tr key={product.id}>
                      <th scope="row">{product.name}</th>
                      <td>{product.stock}</td>
                      <td><strong>{formatMoney(product.price * product.stock)}</strong></td>
                      <td>{product.stock <= 12 ? 'Low stock' : product.stock <= 30 ? 'Watch' : 'Healthy'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-muted">The catalogue is empty.</p>}
        </section>
      </div>

      {lowStock.length ? (
        <p className="admin-muted analytics-footnote">{lowStock.length} product{lowStock.length === 1 ? '' : 's'} at or below 12 units in stock.</p>
      ) : null}
    </div>
  )
}
