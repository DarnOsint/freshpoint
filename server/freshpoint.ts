import { createHash, randomInt } from 'node:crypto'

export type ApiRequest = {
  method?: string
  url?: string
  headers: Record<string, string | string[] | undefined>
  [Symbol.asyncIterator](): AsyncIterator<Buffer | string>
}

export type ApiResponse = {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

export class InputError extends Error {}
export class AuthError extends Error {}
export class ForbiddenError extends Error {}

const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? ''
const secretKey = process.env.SUPABASE_SECRET_KEY ?? ''
const resendKey = process.env.RESEND_API_KEY ?? ''
const fromEmail = process.env.RESEND_FROM_EMAIL || 'FreshPoint <hello@freshpointltd.com>'
const siteUrl = (process.env.SITE_URL || 'https://freshpointltd.com').replace(/\/+$/, '')
const siteHost = siteUrl.replace(/^https?:\/\//, '').split('/')[0]
const r2Base = (process.env.VITE_R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '')
const heroKey = process.env.VITE_R2_HERO_KEY || 'hero-market.jpg'

const logoUrl = r2Base ? `${r2Base}/brand/logo-light.png` : `${siteUrl}/logo-light.png`
const heroUrl = r2Base ? `${r2Base}/${heroKey}` : `${siteUrl}/images/hero-market.jpg`
const CODE_TTL_MS = 10 * 60 * 1000

export function send(res: ApiResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export async function readJson(req: ApiRequest): Promise<Record<string, unknown>> {
  // Vercel's local dev server pre-parses the body; production streams it.
  const parsed = (req as ApiRequest & { body?: unknown }).body
  if (typeof parsed === 'string' || Buffer.isBuffer(parsed)) {
    return JSON.parse(Buffer.isBuffer(parsed) ? parsed.toString('utf8') : parsed) as Record<string, unknown>
  }
  if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
}

export function assertConfigured() {
  if (!supabaseUrl || !anonKey || !secretKey || !resendKey) {
    throw new Error('Email services are not configured')
  }
}

function authHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

export function adminFetch(path: string, init: RequestInit = {}) {
  return fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: { ...authHeaders(secretKey), ...(init.headers as Record<string, string>) },
  })
}

export function publicFetch(path: string, init: RequestInit = {}) {
  return fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: { ...authHeaders(anonKey), ...(init.headers as Record<string, string>) },
  })
}

export function dbFetch(path: string, init: RequestInit = {}) {
  return adminFetch(`/rest/v1${path}`, init)
}

export type AuthUser = {
  id: string
  email?: string | null
  app_metadata?: { role?: string; [key: string]: unknown }
}

export type Role = 'admin' | 'manager' | 'customer'

export function roleFromUser(user: AuthUser | null | undefined): Role {
  const role = user?.app_metadata?.role
  return role === 'admin' || role === 'manager' ? role : 'customer'
}

export type AuditEntry = {
  id: string
  createdAt: string
  actorEmail: string
  actorRole: Role
  action: string
  targetType: string
  targetId: string
  details: Record<string, unknown>
}

export async function recordAudit(
  actor: AuthUser | null | undefined,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
) {
  if (!actor) return
  const response = await dbFetch('/audit_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      actor_id: actor.id,
      actor_email: actor.email ?? '',
      actor_role: roleFromUser(actor),
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    }),
  })
  if (!response.ok) console.warn('Audit log write failed:', response.status)
}

export async function listAuditLogs(): Promise<AuditEntry[]> {
  const response = await dbFetch('/audit_logs?select=id,created_at,actor_email,actor_role,action,target_type,target_id,details&order=created_at.desc&limit=200')
  if (!response.ok) throw new Error('Audit log lookup failed')
  const rows = await response.json() as Array<{
    id: number | string
    created_at: string
    actor_email: string | null
    actor_role: string | null
    action: string
    target_type: string
    target_id: string | null
    details: Record<string, unknown> | null
  }>
  return rows.map((row) => ({
    id: String(row.id),
    createdAt: row.created_at,
    actorEmail: row.actor_email ?? '',
    actorRole: roleFromUser({ id: '', app_metadata: { role: row.actor_role ?? undefined } }),
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id ?? '',
    details: row.details ?? {},
  }))
}

function bearerToken(req: ApiRequest) {
  const raw = req.headers.authorization ?? req.headers.Authorization
  const header = Array.isArray(raw) ? raw[0] : raw
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

export async function requireUser(req: ApiRequest): Promise<AuthUser> {
  const token = bearerToken(req)
  if (!token) throw new AuthError('Sign in to continue.')
  if (!supabaseUrl || !anonKey) throw new Error('Authentication is not configured')

  const response = await publicFetch('/auth/v1/user', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new AuthError('Your session has expired. Please sign in again.')
  return await response.json() as AuthUser
}

export async function requireStaff(req: ApiRequest): Promise<AuthUser> {
  const user = await requireUser(req)
  const role = roleFromUser(user)
  if (role !== 'admin' && role !== 'manager') throw new ForbiddenError('Staff access required.')
  return user
}

export async function requireAdmin(req: ApiRequest): Promise<AuthUser> {
  const user = await requireUser(req)
  if (roleFromUser(user) !== 'admin') throw new ForbiddenError('Admin access required.')
  return user
}

export function newCode() {
  return String(randomInt(100000, 1000000))
}

export function hashCode(code: string) {
  return createHash('sha256').update(`${code}:${secretKey}`).digest('hex')
}

export function codeExpiry() {
  return new Date(Date.now() + CODE_TTL_MS).toISOString()
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char)
}

function greeting(name: string) {
  return escapeHtml(name.trim().split(/\s+/)[0] || 'there')
}

function layout(content: string, preheader: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>FreshPoint</title></head>
<body style="margin:0;padding:0;background:#f1f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#142b1d;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f2;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(20,75,40,.10);">
<tr><td style="height:4px;background:#16a34a;"></td></tr>
<tr><td style="background:#166534;padding:24px 32px;">
<img src="${logoUrl}" alt="FreshPoint" width="140" style="display:block;max-width:140px;height:auto;border:0;" />
<p style="margin:10px 0 0;color:#dcfce7;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Your everyday fresh market</p>
</td></tr>
<tr><td style="padding:36px 32px 32px;">${content}</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 32px;color:#64748b;font-size:12px;line-height:1.6;">
<strong style="color:#166534;">FreshPoint</strong> · Fresh vegetables, fruits, grains and everyday essentials.<br />
Delivered across South Sudan · <a href="${siteUrl}" style="color:#166534;text-decoration:none;">${escapeHtml(siteHost)}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function button(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#166534;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:9px;font-weight:600;font-size:15px;line-height:1.2;">${escapeHtml(label)}</a>`
}

function codeBlock(code: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;"><tr><td style="padding:18px 26px;font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:30px;letter-spacing:8px;color:#14532d;font-weight:700;">${escapeHtml(code)}</td></tr></table>`
}

function finePrint(text: string) {
  return `<p style="margin:20px 0 0;color:#64748b;font-size:12px;line-height:1.6;">${text}</p>`
}

export async function sendConfirmationEmail(email: string, name: string, code: string) {
  const content = `
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#14532d;">Confirm your email</h1>
<p style="margin:0 0 22px;font-size:15px;line-height:1.7;">Hi ${greeting(name)}, use the code below to finish creating your FreshPoint account.</p>
${codeBlock(code)}
${finePrint('This code expires in 10 minutes. If you did not sign up, you can safely ignore this email.')}`
  await sendEmail(email, 'Confirm your FreshPoint email', layout(content, 'Confirm your email to finish setting up your FreshPoint account.'))
}

export async function sendWelcomeEmail(email: string, name: string) {
  const content = `
<img src="${heroUrl}" alt="Fresh produce at a market" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:12px;margin-bottom:24px;" />
<h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#14532d;">Welcome to FreshPoint, ${greeting(name)}.</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.7;">Your account is ready. Browse fresh vegetables, fruits, grains and everyday essentials, then order for delivery in Juba.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;">You can sign in with your email, username or phone number — whichever is easiest for you.</p>
${button(`${siteUrl}/app/shop`, 'Browse the shop')}
${finePrint('Need help? Just reply to this email and our team will assist you.')}`
  await sendEmail(email, 'Welcome to FreshPoint — your account is ready', layout(content, 'Your FreshPoint account is ready. Start shopping fresh produce today.'))
}

export async function sendPasswordResetEmail(email: string, name: string, code: string) {
  const resetUrl = `${siteUrl}/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
  const content = `
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#14532d;">Reset your password</h1>
<p style="margin:0 0 22px;font-size:15px;line-height:1.7;">Hi ${greeting(name)}, use the code below or the button to choose a new password for your FreshPoint account.</p>
${codeBlock(code)}
${button(resetUrl, 'Choose a new password')}
${finePrint('This code expires in 10 minutes and can be used once. If you did not request a reset, no action is needed — your password stays unchanged.')}`
  await sendEmail(email, 'Reset your FreshPoint password', layout(content, 'Use this code to choose a new FreshPoint password.'))
}

export async function sendPasswordChangedEmail(email: string, name: string) {
  const content = `
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#14532d;">Password updated</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;">Hi ${greeting(name)}, your FreshPoint password was changed successfully.</p>
${button(`${siteUrl}/login`, 'Go to login')}
${finePrint('If you did not make this change, reply to this email or contact FreshPoint support right away.')}`
  await sendEmail(email, 'Your FreshPoint password was updated', layout(content, 'Your FreshPoint password was changed successfully.'))
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
  })
  if (!response.ok) {
    console.error('Resend rejected email:', response.status, await response.text())
    throw new Error('Email delivery failed')
  }
}
