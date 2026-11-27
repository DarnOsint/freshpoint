import { useState } from 'react'
import { ChevronRight, Mail, Phone, UsersRound, X } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useData } from '../../lib/data-store'
import { formatDate, initials } from '../../lib/format'
import type { Customer } from '../../lib/types'

function roleLabel(role: Customer['role']) {
  return role === 'manager' ? 'Manager' : role === 'admin' ? 'Admin' : 'Customer'
}

function digits(value: string) {
  return value.replace(/\D/g, '')
}

export function AdminCustomersPage({ readOnly = false }: { readOnly?: boolean }) {
  const { customers, orders, saveCustomer } = useData()
  const { user } = useAuth()
  const [selected, setSelected] = useState<Customer | null>(null)
  const [draft, setDraft] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [sheetError, setSheetError] = useState('')
  const [sheetSaved, setSheetSaved] = useState(false)

  function open(customer: Customer) {
    setSelected(customer)
    setDraft({ ...customer })
    setSheetError('')
    setSheetSaved(false)
  }

  function close() {
    setSelected(null)
    setDraft(null)
    setSheetError('')
    setSheetSaved(false)
  }

  function update(field: keyof Customer, value: string) {
    setDraft((current) => current ? { ...current, [field]: value } : current)
    setSheetSaved(false)
  }

  async function handleSave() {
    if (!draft || saving) return
    setSaving(true)
    setSheetError('')
    try {
      await saveCustomer(draft)
      setSelected({ ...draft })
      setSheetSaved(true)
    } catch (caught) {
      setSheetError(caught instanceof Error ? caught.message : 'We could not save this customer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">People</p>
          <h1>Customers</h1>
          <p>{readOnly ? 'A read-only list of everyone who has an account with FreshPoint.' : 'Everyone with a FreshPoint account.'}</p>
          {!readOnly ? <p className="admin-muted">Tap a customer to see and edit their details. Only an admin can change a role.</p> : null}
        </div>
      </header>

      {customers.length ? (
        <div className="customer-list">
          {customers.map((customer) => {
            const count = customer.phone ? orders.filter((order) => digits(order.phone) === digits(customer.phone)).length : 0
            return (
              <button className="customer-row" key={customer.id} type="button" onClick={() => open(customer)}>
                <span className="profile-avatar profile-avatar--small">{initials(customer.name)}</span>
                <span className="customer-row__main">
                  <strong>{customer.name}</strong>
                  <small>@{customer.username}</small>
                </span>
                <span className="account-chip">{roleLabel(customer.role ?? 'customer')}</span>
                <small className="customer-row__orders">{count} order{count === 1 ? '' : 's'}</small>
                <ChevronRight size={18} />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="empty-state"><UsersRound size={28} /><h3>No customers yet</h3><p>Customers will appear here once they create an account.</p></div>
      )}

      {selected && draft ? (
        <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
          <div className="customer-sheet" role="dialog" aria-modal="true" aria-labelledby="customer-sheet-title">
            <div className="customer-sheet__head">
              <div>
                <p className="eyebrow">Customer details</p>
                <h2 id="customer-sheet-title">{selected.name}</h2>
              </div>
              <button className="admin-icon-button" type="button" onClick={close} aria-label="Close customer details"><X size={20} /></button>
            </div>

            <div className="customer-sheet__summary">
              <span className="profile-avatar profile-avatar--small">{initials(draft.name || selected.name)}</span>
              <div>
                <strong>@{draft.username || selected.username}</strong>
                <small>Joined {formatDate(selected.joinedAt)}</small>
              </div>
              <span className="account-chip">{roleLabel(selected.role ?? 'customer')}</span>
            </div>

            <div className="customer-sheet__form">
              <div className="field">
                <label htmlFor="customerName">Full name</label>
                <input id="customerName" value={draft.name} onChange={(event) => update('name', event.target.value)} disabled={readOnly} />
              </div>
              <div className="field">
                <label htmlFor="customerUsername">Username</label>
                <input id="customerUsername" value={draft.username} onChange={(event) => update('username', event.target.value.toLowerCase())} disabled={readOnly} />
              </div>
              <div className="field">
                <label htmlFor="customerEmail"><Mail size={15} /> Email address</label>
                <input id="customerEmail" type="email" value={draft.email} onChange={(event) => update('email', event.target.value.toLowerCase())} disabled={readOnly} />
              </div>
              <div className="field">
                <label htmlFor="customerPhone"><Phone size={15} /> Phone number</label>
                <input id="customerPhone" type="tel" value={draft.phone} onChange={(event) => update('phone', event.target.value)} disabled={readOnly} />
              </div>
              <div className="field">
                <label htmlFor="customerRole">Role</label>
                {!readOnly && selected.id !== user?.id && selected.role !== 'admin' ? (
                  <select id="customerRole" value={draft.role === 'manager' ? 'manager' : 'customer'} onChange={(event) => update('role', event.target.value)}>
                    <option value="customer">Customer</option>
                    <option value="manager">Manager</option>
                  </select>
                ) : (
                  <input id="customerRole" value={roleLabel(selected.role ?? 'customer')} disabled />
                )}
              </div>
            </div>

            {sheetError ? <p className="field-error admin-inline-error">{sheetError}</p> : null}
            {sheetSaved ? <p className="profile-success">Customer saved.</p> : null}

            {readOnly ? (
              <p className="admin-muted">Managers can view customers but cannot edit them.</p>
            ) : (
              <div className="admin-form__actions">
                <button className="btn btn--primary btn--block btn--large" type="button" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? 'Saving…' : 'Save customer'}
                </button>
                <button className="btn btn--outline btn--block" type="button" onClick={close}>Close</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
