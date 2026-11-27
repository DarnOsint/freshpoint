import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth-context'

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return 'We could not enable notifications.'
  if (/permission denied/i.test(error.message)) {
    return 'Notifications are blocked for this site. Allow them in your browser settings, then try again.'
  }
  if (/registration failed|push service/i.test(error.message)) {
    return 'This browser could not register device notifications. On iPhone, add FreshPoint to your home screen first.'
  }
  return error.message
}

export function usePushNotifications() {
  const { session } = useAuth()
  const token = session?.access_token ?? ''
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const refresh = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const registration = await navigator.serviceWorker.ready
      if (!registration.pushManager) return
      const subscription = await registration.pushManager.getSubscription()
      setEnabled(Boolean(subscription))
      if (!subscription || !token) return
      await fetch('/api/customers?view=push', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      }).catch(() => undefined)
    } catch {
      setEnabled(false)
    }
  }, [token])

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const enable = useCallback(async () => {
    setBusy(true)
    setNote('')
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setNote('Device notifications are not supported in this browser.')
        return false
      }
      if (Notification.permission === 'denied') {
        setNote('Notifications are blocked for this site. Allow them in your browser settings, then try again.')
        return false
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setNote('Allow notifications in your browser settings to receive order updates.')
        return false
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const configResponse = await fetch('/api/customers?view=push', { headers, cache: 'no-store' })
      if (!configResponse.ok) throw new Error('We could not load notification settings.')
      const config = await configResponse.json() as { publicKey?: string }
      if (!config.publicKey) throw new Error('Push notifications are not configured yet.')

      const registration = await navigator.serviceWorker.ready
      if (!registration.pushManager) {
        setNote('Device notifications are not supported in this browser. On iPhone, add FreshPoint to your home screen first.')
        return false
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      })
      const saved = await fetch('/api/customers?view=push', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!saved.ok) {
        const body = await saved.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error || 'We could not save your notification settings.')
      }
      setEnabled(true)
      return true
    } catch (error) {
      setNote(friendlyError(error))
      return false
    } finally {
      setBusy(false)
    }
  }, [token])

  return { enabled, busy, note, enable }
}
