import { useNavigate } from 'react-router-dom'
import { useData } from '../lib/data-store'
import { formatDate } from '../lib/format'
import { useSiteSettings } from '../lib/site-content'
import { usePushNotifications } from '../lib/use-push-notifications'
import { useSheetDismiss } from '../lib/use-sheet-dismiss'
import type { AppNotification } from '../lib/types'
import { SheetCloseButton } from './SheetCloseButton'

export function NotificationSheet({ onClose, ordersPath = '/app/orders' }: { onClose: () => void; ordersPath?: string }) {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadNotificationCount } = useData()
  const { enabled: pushEnabled, busy: pushBusy, note: pushNote, enable: enablePush } = usePushNotifications()
  const copy = useSiteSettings().settings.interface.app.shell
  const navigate = useNavigate()

  useSheetDismiss(true, onClose)

  function openNotification(notification: AppNotification) {
    markNotificationRead(notification.id)
    onClose()
    if (notification.orderId) navigate(`${ordersPath}?order=${encodeURIComponent(notification.orderId)}`)
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="notification-sheet" role="dialog" aria-modal="true" aria-labelledby="notification-sheet-title">
        <div className="notification-sheet__head">
          <div>
            <p className="eyebrow">FreshPoint</p>
            <h2 id="notification-sheet-title">{copy.notifications}</h2>
          </div>
          <SheetCloseButton label={`Close ${copy.notifications}`} onClick={onClose} />
        </div>

        <div className="notification-push">
          <div>
            <strong>Device notifications</strong>
            <small>Get order updates even when FreshPoint is closed. On iPhone, add FreshPoint to your home screen first.</small>
          </div>
          <button type="button" className="btn btn--primary btn--small" onClick={() => void enablePush()} disabled={pushEnabled || pushBusy}>
            {pushEnabled ? 'Enabled' : pushBusy ? 'Enabling…' : 'Enable'}
          </button>
        </div>
        {pushNote ? <p className="notification-push__note">{pushNote}</p> : null}

        {notifications.length ? (
          <>
            <div className="notification-sheet__head-row">
              <small>{notifications.length} {copy.notifications.toLowerCase()}</small>
              {unreadNotificationCount ? (
                <button className="notification-mark-all" type="button" onClick={markAllNotificationsRead}>{copy.markAllRead}</button>
              ) : null}
            </div>
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`notification-row${notification.read ? '' : ' notification-row--unread'}`}
                  type="button"
                  onClick={() => openNotification(notification)}
                >
                  <span className="notification-row__dot" aria-hidden="true" />
                  <span>
                    <strong>{notification.title}</strong>
                    <small>{notification.body}</small>
                    <em>{formatDate(notification.createdAt)}</em>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>{copy.noNotifications}</h3>
            <p>{copy.noNotificationsHint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
