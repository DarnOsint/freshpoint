import { adminFetch, type ApiRequest, type ApiResponse } from '../server/freshpoint.js'

const OBJECT_PATH = '/storage/v1/object/site/settings.json'

const fallback = {
  name: 'FreshPoint — Your Everyday Fresh Market',
  short_name: 'FreshPoint',
  description: 'Fresh vegetables, fruits, grains and everyday food essentials for South Sudan.',
  theme_color: '#166534',
}

type StoredSettings = {
  seo?: {
    manifestName?: string
    manifestShortName?: string
    description?: string
    themeColor?: string
  }
}

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  let settings: StoredSettings | null = null
  try {
    const response = await adminFetch(OBJECT_PATH, { headers: { Accept: 'application/json' } })
    if (response.ok) settings = await response.json() as StoredSettings
  } catch {
    // Serve the bundled manifest when site settings are unavailable.
  }

  const manifest = {
    name: settings?.seo?.manifestName || fallback.name,
    short_name: settings?.seo?.manifestShortName || fallback.short_name,
    description: settings?.seo?.description || fallback.description,
    theme_color: settings?.seo?.themeColor || fallback.theme_color,
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/login',
    scope: '/',
    categories: ['shopping', 'food', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/manifest+json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(manifest))
}
