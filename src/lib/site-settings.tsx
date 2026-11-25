import { useEffect, useState, type ReactNode } from 'react'
import {
  SiteSettingsContext, defaultSiteSettings, mergeSiteSettings,
  type SiteSettings,
} from './site-content'
import { supabase } from './supabase'

const STORAGE_KEY = 'freshpoint-site-v1'

async function sessionHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function loadCachedSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return mergeSiteSettings(defaultSiteSettings, JSON.parse(raw))
  } catch {
    // Fall through to the bundled defaults.
  }
  return defaultSiteSettings
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(loadCachedSettings)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = settings.seo.title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', settings.seo.description)
  }, [settings.seo.description, settings.seo.title])

  useEffect(() => {
    let active = true
    fetch('/api/site-settings', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((remote: unknown) => {
        if (active && remote && typeof remote === 'object') {
          setSettings((current) => mergeSiteSettings(current, remote))
        }
      })
      .catch(() => {
        // Keep cached/default content when the network is unavailable.
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => { active = false }
  }, [])

  async function saveSiteSettings(next: SiteSettings) {
    setSaving(true)
    try {
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...await sessionHeaders() },
        body: JSON.stringify(next),
      })
      if (!response.ok) throw new Error('Save failed')
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage is optional; the server copy is authoritative.
      }
      setSettings(next)
    } catch {
      throw new Error('We could not save the website content. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, loaded, saveSiteSettings, saving }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}
