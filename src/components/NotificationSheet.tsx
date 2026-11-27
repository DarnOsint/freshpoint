import { useNavigate } from 'react-router-dom'
import { useData } from '../lib/data-store'
import { formatDate } from '../lib/format'
import { useSiteSettings } from '../lib/site-content'
import { useSheetDismiss } from '../lib/use-sheet-dismiss'
import type { AppNotification } from '../lib/types'
import { SheetCloseButton } from './SheetCloseButton'

export function NotificationSheet({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadNotificationCount } = useData()
  const copy = useSiteSettings().settings.interface.app.shell
  const navigate = useNavigate()

  useSheetDismiss(true, onClose)

  function openNotification(notification: AppNotification) {
    markNotificationRead(notification.id)
    onClose()
    if (notification.orderId) navigate(`/app/orders?order=${encodeURIComponent(notification.orderId)}`)
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
