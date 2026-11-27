import { useState } from 'react'
import { Mail, Phone, UsersRound } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { formatDate, initials } from '../../lib/format'
import type { Customer } from '../../lib/types'

export function AdminCustomersPage({ readOnly = false }: { readOnly?: boolean }) {
  const { customers, orders, setCustomerRole } = useData()
  const { user } = useAuth()
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  async function changeRole(customer: Customer, role: 'manager' | 'customer') {
    if (busyId) return
    setError('')
    setBusyId(customer.id)
    try {
      await setCustomerRole(customer.id, role)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not change this role. Please try again.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">People</p>
          <h1>Customers</h1>
          <p>{readOnly ? 'A read-only list of everyone who has an account with FreshPoint.' : 'Everyone with a FreshPoint account.'}</p>
          {!readOnly ? <p className="admin-muted">Only an admin can promote a customer to manager. Managers sign in at /login.</p> : null}
        </div>
      </header>

      {error ? <p className="field-error admin-inline-error">{error}</p> : null}

      {customers.length ? (
        <div className="customer-grid">
          {customers.map((customer) => {
            const count = orders.filter((order) => order.phone === customer.phone).length
            const role = customer.role ?? 'customer'
            const canManage = !readOnly && role !== 'admin' && customer.id !== user?.id
            return (
              <article className="customer-card" key={customer.id}>
                <div className="customer-card__head">
                  <span className="profile-avatar profile-avatar--small">{initials(customer.name)}</span>
                  <div><strong>{customer.name}</strong><small>@{customer.username}</small></div>
                </div>
                <div className="customer-card__meta">
                  <span><Phone size={15} /> {customer.phone || 'No phone on file'}</span>
                  <span><Mail size={15} /> {customer.email || 'No email on file'}</span>
                </div>
                <div className="customer-card__foot">
                  <span className="account-chip">{role === 'manager' ? 'Manager' : role === 'admin' ? 'Admin' : 'Customer'}</span>
                  <small>{count} order{count === 1 ? '' : 's'} · joined {formatDate(customer.joinedAt)}</small>
                </div>
                {canManage ? (
                  <button
                    type="button"
                    className="btn btn--outline btn--small btn--block"
                    disabled={busyId === customer.id}
                    onClick={() => void changeRole(customer, role === 'manager' ? 'customer' : 'manager')}>
                    {role === 'manager' ? 'Remove manager access' : 'Promote to manager'}
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state"><UsersRound size={28} /><h3>No customers yet</h3><p>Customers will appear here once they create an account.</p></div>
      )}
    </div>
  )
}
