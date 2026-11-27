import { useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { useData } from '../lib/data-store'
import { usePushNotifications } from '../lib/use-push-notifications'
import { useSheetDismiss } from '../lib/use-sheet-dismiss'
import { SheetCloseButton } from './SheetCloseButton'

export function PushOptInPrompt() {
  const { user } = useAuth()
  const { trackEvent } = useData()
  const { enabled, busy, note, enable } = usePushNotifications()
  const storageKey = user ? `freshpoint:push-prompt:${user.id}` : ''
  const [dismissed, setDismissed] = useState(() => {
    if (!storageKey) return false
    try {
      return window.localStorage.getItem(storageKey) === 'dismissed'
    } catch {
      return false
    }
  })

  function dismiss(reason = 'not-now') {
    trackEvent({
      action: 'notification.prompt_dismiss',
      targetType: 'notification',
      targetId: 'prompt',
      details: { reason },
    })
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, 'dismissed')
    } catch {
      // Storage may be unavailable; the prompt still closes for this session.
    }
    setDismissed(true)
  }

  async function handleEnable() {
    const ok = await enable()
    if (!ok) return
    trackEvent({ action: 'notification.enable', targetType: 'notification', targetId: 'device', details: { source: 'prompt' } })
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, 'enabled')
    } catch {
      // The subscription itself is stored on the account.
    }
  }

  const open = Boolean(user) && !enabled && !dismissed
  useSheetDismiss(open, () => dismiss('escape'))

  if (!open) return null

  return (
    <div className="sheet-backdrop">
      <div className="push-prompt" role="dialog" aria-modal="true" aria-labelledby="push-prompt-title">
        <div className="notification-sheet__head">
          <div>
            <p className="eyebrow">FreshPoint</p>
            <h2 id="push-prompt-title">Never miss an order update</h2>
          </div>
          <SheetCloseButton label="Dismiss notification prompt" onClick={() => dismiss('close')} />
        </div>

        <div className="push-prompt__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </div>
        <p>
          We’ll let you know when an order is placed, being prepared, out for delivery, delivered or cancelled —
          even when FreshPoint is closed.
        </p>
        {note ? <p className="push-prompt__note">{note}</p> : null}
        <div className="push-prompt__actions">
          <button type="button" className="btn btn--primary" onClick={() => void handleEnable()} disabled={busy}>
            {busy ? 'Enabling…' : 'Enable notifications'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => dismiss('not-now')} disabled={busy}>Not now</button>
        </div>
        <small>On iPhone, add FreshPoint to your home screen before enabling.</small>
      </div>
    </div>
  )
}
