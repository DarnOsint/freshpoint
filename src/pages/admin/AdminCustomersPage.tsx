import { Mail, Phone, UsersRound } from 'lucide-react'
import { useData } from '../../lib/data-store'
import { formatDate, initials } from '../../lib/format'

export function AdminCustomersPage() {
  const { customers, orders } = useData()

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">People</p>
          <h1>Customers</h1>
          <p>Everyone who has shopped with FreshPoint.</p>
        </div>
      </header>

      {customers.length ? (
        <div className="customer-grid">
          {customers.map((customer) => {
            const count = orders.filter((order) => order.phone === customer.phone).length
            return (
              <article className="customer-card" key={customer.id}>
                <div className="customer-card__head">
                  <span className="profile-avatar profile-avatar--small">{initials(customer.name)}</span>
                  <div><strong>{customer.name}</strong><small>@{customer.username}</small></div>
                </div>
                <div className="customer-card__meta">
                  <span><Phone size={15} /> {customer.phone}</span>
                  <span><Mail size={15} /> {customer.email || 'No email on file'}</span>
                </div>
                <div className="customer-card__foot">
                  <span className="account-chip">Customer</span>
                  <small>{count} order{count === 1 ? '' : 's'} · joined {formatDate(customer.joinedAt)}</small>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state"><UsersRound size={28} /><h3>No customers yet</h3><p>Customers will appear here after their first order.</p></div>
      )}
    </div>
  )
}
