import { createContext, useContext } from 'react'
import defaults from './site-defaults.json'

export type SiteTone = 'green' | 'orange' | 'amber' | 'brown' | 'red' | 'teal'
export type SiteIcon = 'sprout' | 'badge' | 'store' | 'truck' | 'handshake' | 'clipboard' | 'basket' | 'package'

export type SiteLink = { label: string; href: string }
export type SitePoint = { text: string; icon: SiteIcon }
export type SiteStat = { value: string; label: string }
export type SiteCategory = {
  emoji: string
  name: string
  description: string
  products: string
  tone: SiteTone
}
export type SiteFeature = { icon: SiteIcon; title: string; text: string }
export type SiteStep = { icon: SiteIcon; title: string; text: string }

export type SiteSettings = {
  brand: {
    appName: string
    tagline: string
    eyebrow: string
    footerAbout: string
    footerTagline: string
    copyright: string
    heroPhotoKey: string
    heroPhotoAlt: string
  }
  announcement: { primary: string; secondary: string }
  contact: { location: string; email: string; phone: string; hours: string }
  navigation: SiteLink[]
  hero: {
    eyebrow: string
    title: string
    highlight: string
    lead: string
    primaryLabel: string
    secondaryLabel: string
    points: SitePoint[]
    floatTopTitle: string
    floatTopSubtitle: string
    floatBottomTitle: string
    floatBottomSubtitle: string
    produce: string
  }
  stats: { items: SiteStat[] }
  categories: {
    eyebrow: string
    title: string
    intro: string
    items: SiteCategory[]
  }
  products: { eyebrow: string; title: string; intro: string; note: string }
  reasons: { eyebrow: string; title: string; items: SiteFeature[] }
  steps: { eyebrow: string; title: string; items: SiteStep[] }
  wholesale: {
    eyebrow: string
    title: string
    body: string
    primaryLabel: string
    secondaryLabel: string
    subject: string
    art: string
  }
  location: { titlePrefix: string; body: string; ctaLabel: string }
  footer: {
    exploreTitle: string
    contactTitle: string
    ctaTitle: string
    ctaBody: string
    ctaLabel: string
    bottomLine: string
    createAccountLabel: string
    loginLabel: string
  }
}

export const defaultSiteSettings = defaults as unknown as SiteSettings

export const siteTones: SiteTone[] = ['green', 'orange', 'amber', 'brown', 'red', 'teal']
export const siteIcons: SiteIcon[] = ['sprout', 'badge', 'store', 'truck', 'handshake', 'clipboard', 'basket', 'package']

function mergeValue<T>(base: T, incoming: unknown): T {
  if (Array.isArray(base)) return Array.isArray(incoming) ? incoming as T : base
  if (base && typeof base === 'object') {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return base
    const source = base as Record<string, unknown>
    const result: Record<string, unknown> = { ...source }
    for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
      if (key in source) result[key] = mergeValue(source[key], value)
    }
    return result as T
  }
  return incoming !== undefined && typeof incoming === typeof base ? incoming as T : base
}

export function mergeSiteSettings(base: SiteSettings, incoming: unknown): SiteSettings {
  return mergeValue(base, incoming)
}

export type SiteSettingsValue = {
  settings: SiteSettings
  loaded: boolean
  saveSiteSettings: (settings: SiteSettings) => Promise<void>
  saving: boolean
}

export const SiteSettingsContext = createContext<SiteSettingsValue | null>(null)

export function useSiteSettings() {
  const value = useContext(SiteSettingsContext)
  if (!value) throw new Error('useSiteSettings must be used inside SiteSettingsProvider')
  return value
}
