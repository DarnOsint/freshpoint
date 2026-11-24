const publicBase = (import.meta.env.VITE_R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '')

/**
 * Resolve a Cloudflare R2 object key (or a full URL) to a displayable image URL.
 * Falls back to a local bundled asset when R2 is not configured.
 */
export function imageUrl(key?: string | null, fallback = '') {
  const value = key?.trim()
  if (!value) return fallback
  if (/^(https?:\/\/|data:|blob:)/i.test(value)) return value
  if (value.startsWith('/')) return value

  if (publicBase) return `${publicBase}/${value}`
  return fallback
}
