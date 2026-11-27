import { Link } from 'react-router-dom'
import { useData } from '../../lib/data-store'
import { formatMoney } from '../../lib/format'
import type { ActivityEvent, Role } from '../../lib/types'

const statuses = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'] as const

const actionLabels: Record<string, string> = {
  'session.open': 'App opened',
  'session.login': 'Signed in',
  'user.signup': 'Account created',
  'catalogue.search': 'Product search',
  'catalogue.filter': 'Category filter',
  'catalogue.add': 'Added to basket',
  'catalogue.increase': 'Quantity increased',
  'catalogue.decrease': 'Quantity reduced',
  'cart.open': 'Basket opened',
  'checkout.start': 'Checkout started',
  'order.created': 'Order placed',
  'order.view': 'Order viewed',
  'notification.open': 'Notifications opened',
  'notification.read': 'Notification opened',
  'notification.read_all': 'All notifications read',
  'notification.enable': 'Device notifications enabled',
  'notification.prompt_dismiss': 'Notification prompt dismissed',
  'profile.update': 'Profile updated',
  'support.contact': 'Support contacted',
  'product.save': 'Product saved',
  'product.delete': 'Product deleted',
  'order.status_change': 'Order status changed',
  'customer.update': 'Customer updated',
  'customer.role_change': 'Role changed',
  'website.save': 'Website saved',
  'image.upload': 'Image uploaded',
}

function dayKey(value: string) {
  return value.slice(0, 10)
}

function lastDayKeys(count: number) {
  const days: string[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    days.push(date.toISOString().slice(0, 10))
  }
  return days
}

function actorKey(event: ActivityEvent) {
  return event.actorId || event.actorEmail || 'unknown'
}

function uniqueActors(rows: ActivityEvent[]) {
  return new Set(rows.map(actorKey).filter((key) => key !== 'unknown')).size
}

function percent(numerator: number, denominator: number) {
  return denominator ? `${Math.round((numerator / denominator) * 100)}%` : '0%'
}

function shortDate(value: string) {
  return dayKey(value) || '—'
}

export function AdminDashboardPage() {
  const { orders, products, customers, events } = useData()

  const activity = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const days = lastDayKeys(7)
  const recentActivity = activity.filter((event) => days.includes(dayKey(event.createdAt)))
  const rowsFor = (actions: string[], rows = activity) => rows.filter((event) => actions.includes(event.action))
  const countFor = (actions: string[], rows = activity) => rowsFor(actions, rows).length

  const sessions = rowsFor(['session.open', 'session.login', 'user.signup'])
  const catalogue = activity.filter((event) => event.action.startsWith('catalogue.'))
  const basketAdds = rowsFor(['catalogue.add', 'catalogue.increase'])
  const searches = rowsFor(['catalogue.search'])
  const checkouts = rowsFor(['checkout.start'])
  const placedOrders = rowsFor(['order.created'])
  const notificationOptIns = rowsFor(['notification.enable'])
  const supportContacts = rowsFor(['support.contact'])

  const funnel = [
    { label: 'App sessions', rows: sessions },
    { label: 'Catalogue engagement', rows: catalogue },
    { label: 'Added to basket', rows: basketAdds },
    { label: 'Checkout started', rows: checkouts },
    { label: 'Order placed', rows: placedOrders },
  ].map((step, index, all) => ({
    label: step.label,
    users: uniqueActors(step.rows),
    events: step.rows.length,
    conversion: index === 0 ? '100%' : percent(uniqueActors(step.rows), uniqueActors(all[index - 1].rows)),
  }))

  const behaviourRows = [
    { label: 'Active accounts (7 days)', value: String(uniqueActors(recentActivity)), detail: 'Distinct accounts with activity' },
    { label: 'Behaviour events', value: String(activity.length), detail: 'Recorded across all accounts' },
    { label: 'Catalogue searches', value: String(searches.length), detail: `${uniqueActors(searches)} shoppers searched` },
    { label: 'Search-to-basket', value: percent(uniqueActors(basketAdds), uniqueActors(searches)), detail: 'Searched shoppers who added an item' },
    { label: 'Checkout starts', value: String(checkouts.length), detail: `${uniqueActors(checkouts)} shoppers` },
    { label: 'Checkout completion', value: percent(uniqueActors(placedOrders), uniqueActors(checkouts)), detail: 'Started checkout → placed order' },
    { label: 'Notification opt-ins', value: String(notificationOptIns.length), detail: 'Prompt and bell combined' },
    { label: 'Notification opens', value: String(countFor(['notification.open'])), detail: 'Bell sheet opened' },
    { label: 'Order detail views', value: String(countFor(['order.view'])), detail: 'Customer order popups' },
    { label: 'Support contacts', value: String(supportContacts.length), detail: 'WhatsApp and email clicks' },
    { label: 'Profile updates', value: String(countFor(['profile.update'])), detail: 'Saved account details' },
    { label: 'Staff actions', value: String(activity.filter((event) => event.actorRole !== 'customer').length), detail: 'Admin and manager activity' },
  ]

  const dailyBehaviour = [...days].reverse().map((date) => {
    const rows = activity.filter((event) => dayKey(event.createdAt) === date)
    return {
      date,
      sessions: countFor(['session.open', 'session.login', 'user.signup'], rows),
      catalogue: rows.filter((event) => event.action.startsWith('catalogue.')).length,
      adds: countFor(['catalogue.add', 'catalogue.increase'], rows),
      checkouts: countFor(['checkout.start'], rows),
      orders: countFor(['order.created'], rows),
    }
  })

  const actionGroups = new Map<string, ActivityEvent[]>()
  for (const event of activity) {
    actionGroups.set(event.action, [...(actionGroups.get(event.action) ?? []), event])
  }
  const eventBreakdown = [...actionGroups.entries()]
    .map(([action, rows]) => ({
      label: actionLabels[action] ?? action,
      count: rows.length,
      users: uniqueActors(rows),
      last: rows[0]?.createdAt ?? '',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const userGroups = new Map<string, { label: string; role: Role; count: number; last: string }>()
  for (const event of activity) {
    const key = actorKey(event)
    if (key === 'unknown') continue
    const row = userGroups.get(key) ?? {
      label: event.actorEmail || `${key.slice(0, 8)}…`,
      role: event.actorRole,
      count: 0,
      last: event.createdAt,
    }
    row.count += 1
    userGroups.set(key, row)
  }
  const topActiveUsers = [...userGroups.values()].sort((a, b) => b.count - a.count).slice(0, 8)

  const interestGroups = new Map<string, { label: string; kind: string; count: number; results: number }>()
  for (const event of activity.filter((item) => item.action === 'catalogue.search' || item.action === 'catalogue.filter')) {
    const label = event.targetId || String(event.details.term ?? '')
    if (!label) continue
    const key = `${event.action}:${label.toLowerCase()}`
    const row = interestGroups.get(key) ?? {
      label,
      kind: event.action === 'catalogue.search' ? 'Search' : 'Category',
      count: 0,
      results: 0,
    }
    row.count += 1
    const results = Number(event.details.results)
    if (Number.isFinite(results)) row.results = results
    interestGroups.set(key, row)
  }
  const topInterests = [...interestGroups.values()].sort((a, b) => b.count - a.count).slice(0, 6)

  const roleGroups = new Map<Role, { count: number; users: Set<string> }>()
  for (const event of activity) {
    const row = roleGroups.get(event.actorRole) ?? { count: 0, users: new Set<string>() }
    row.count += 1
    row.users.add(actorKey(event))
    roleGroups.set(event.actorRole, row)
  }
  const audienceMix = [...roleGroups.entries()]
    .map(([role, row]) => ({ role, count: row.count, users: row.users.size, share: percent(row.count, activity.length) }))
    .sort((a, b) => b.count - a.count)

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
          <p>Sales, customer behaviour, order flow and inventory health across FreshPoint.</p>
        </div>
        <Link to="/admin/orders" className="btn btn--primary btn--small">Manage orders</Link>
      </header>

      <div className="stat-grid stat-grid--admin">
        <div className="stat-card"><strong>{formatMoney(revenue)}</strong><small>Order value</small></div>
        <div className="stat-card"><strong>{sorted.length}</strong><small>Orders placed</small></div>
        <div className="stat-card"><strong>{formatMoney(average)}</strong><small>Average order</small></div>
        <div className="stat-card"><strong>{pending}</strong><small>Pending orders</small></div>
        <div className="stat-card"><strong>{uniqueActors(activity)}</strong><small>Active accounts</small></div>
        <div className="stat-card"><strong>{checkouts.length}</strong><small>Checkouts started</small></div>
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

      <section className="admin-panel analytics-panel">
        <div className="admin-panel__head"><h2>Behaviour</h2><span className="admin-muted">Tracked across the app</span></div>
        <div className="analytics-scroll">
          <table className="analytics-table">
            <thead><tr><th>Signal</th><th>Value</th><th>Detail</th></tr></thead>
            <tbody>
              {behaviourRows.map((row) => (
                <tr key={row.label}><th scope="row">{row.label}</th><td><strong>{row.value}</strong></td><td>{row.detail}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel analytics-panel">
        <div className="admin-panel__head"><h2>Conversion funnel</h2><span className="admin-muted">Unique accounts</span></div>
        <div className="analytics-scroll">
          <table className="analytics-table">
            <thead><tr><th>Step</th><th>Users</th><th>Events</th><th>Conversion</th></tr></thead>
            <tbody>
              {funnel.map((step) => (
                <tr key={step.label}>
                  <th scope="row">{step.label}</th>
                  <td>{step.users}</td>
                  <td>{step.events}</td>
                  <td><strong>{step.conversion}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel analytics-panel">
        <div className="admin-panel__head"><h2>Daily behaviour</h2><span className="admin-muted">Latest 7 days, newest first</span></div>
        <div className="analytics-scroll">
          <table className="analytics-table">
            <thead><tr><th>Date</th><th>Sessions</th><th>Catalogue</th><th>Adds</th><th>Checkouts</th><th>Orders</th></tr></thead>
            <tbody>
              {dailyBehaviour.map((row) => (
                <tr key={row.date}>
                  <th scope="row">{row.date}</th>
                  <td>{row.sessions}</td>
                  <td>{row.catalogue}</td>
                  <td>{row.adds}</td>
                  <td>{row.checkouts}</td>
                  <td><strong>{row.orders}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-columns">
        <section className="admin-panel analytics-panel">
          <div className="admin-panel__head"><h2>Event breakdown</h2><span className="admin-muted">Top 10 actions</span></div>
          {eventBreakdown.length ? (
            <div className="analytics-scroll">
              <table className="analytics-table">
                <thead><tr><th>Action</th><th>Events</th><th>Users</th><th>Last seen</th></tr></thead>
                <tbody>
                  {eventBreakdown.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td>{row.count}</td>
                      <td>{row.users}</td>
                      <td>{shortDate(row.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-muted">No tracked activity yet. Interactions will appear here.</p>}
        </section>

        <section className="admin-panel analytics-panel">
          <div className="admin-panel__head"><h2>Top active users</h2><span className="admin-muted">By tracked events</span></div>
          {topActiveUsers.length ? (
            <div className="analytics-scroll">
              <table className="analytics-table">
                <thead><tr><th>Account</th><th>Role</th><th>Events</th><th>Last seen</th></tr></thead>
                <tbody>
                  {topActiveUsers.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td>{row.role}</td>
                      <td><strong>{row.count}</strong></td>
                      <td>{shortDate(row.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-muted">No active accounts recorded yet.</p>}
        </section>
      </div>

      <div className="admin-columns">
        <section className="admin-panel analytics-panel">
          <div className="admin-panel__head"><h2>Catalogue interests</h2><span className="admin-muted">Searches and filters</span></div>
          {topInterests.length ? (
            <div className="analytics-scroll">
              <table className="analytics-table">
                <thead><tr><th>Term / category</th><th>Type</th><th>Uses</th><th>Results</th></tr></thead>
                <tbody>
                  {topInterests.map((row) => (
                    <tr key={`${row.kind}:${row.label}`}>
                      <th scope="row">{row.label}</th>
                      <td>{row.kind}</td>
                      <td><strong>{row.count}</strong></td>
                      <td>{row.results || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-muted">Search and filter activity will appear here.</p>}
        </section>

        <section className="admin-panel analytics-panel">
          <div className="admin-panel__head"><h2>Audience mix</h2><span className="admin-muted">Activity by role</span></div>
          {audienceMix.length ? (
            <div className="analytics-scroll">
              <table className="analytics-table">
                <thead><tr><th>Role</th><th>Accounts</th><th>Events</th><th>Share</th></tr></thead>
                <tbody>
                  {audienceMix.map((row) => (
                    <tr key={row.role}>
                      <th scope="row">{row.role}</th>
                      <td>{row.users}</td>
                      <td><strong>{row.count}</strong></td>
                      <td>{row.share}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-muted">Audience activity will appear here.</p>}
        </section>
      </div>

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
