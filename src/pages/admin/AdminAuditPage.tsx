import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'

type AuditEntry = {
  id: string
  createdAt: string
  actorEmail: string
  actorRole: string
  action: string
  targetType: string
  targetId: string
  details: Record<string, unknown>
}

export function AdminAuditPage() {
  const { session } = useAuth()
  const token = session?.access_token
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch('/api/customers?view=audit', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => null) as AuditEntry[] | { error?: string } | null
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error((payload && !Array.isArray(payload) && payload.error) || 'The audit log could not be loaded.')
      }
      setEntries(payload)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The audit log could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [token])

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { void load() }, [load])

  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
  }

  function formatDetails(details: Record<string, unknown>) {
    const parts = Object.entries(details).map(([key, value]) => `${key}: ${String(value)}`)
    return parts.join(' · ')
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Audit log</h1>
          <p>Every staff change is recorded here with the person who made it.</p>
        </div>
        <button
          type="button"
          className="btn btn--outline btn--small"
          onClick={() => { setLoading(true); setError(''); void load() }}
        >
          Refresh
        </button>
      </header>

      {loading ? <p className="section-hint">Loading audit log…</p> : null}
      {error ? <div className="audit-empty">{error}</div> : null}
      {!loading && !error && !entries.length ? (
        <div className="audit-empty">
          <strong>No activity recorded yet.</strong>
          <span>Product, order, customer, website and image changes will appear here.</span>
        </div>
      ) : null}

      {entries.length ? (
        <div className="audit-list">
          {entries.map((entry) => (
            <article className="audit-row" key={entry.id}>
              <div className="audit-row__main">
                <strong>{entry.action}</strong>
                <small>{entry.actorEmail || 'Staff member'} · {entry.actorRole}</small>
              </div>
              <div className="audit-row__meta">
                <span>{entry.targetType}: {entry.targetId || '—'}</span>
                <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
              </div>
              {Object.keys(entry.details).length ? (
                <p className="audit-row__details">{formatDetails(entry.details)}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
