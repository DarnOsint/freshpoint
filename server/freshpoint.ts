import { createHash, randomInt } from 'node:crypto'

export type ApiRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  [Symbol.asyncIterator](): AsyncIterator<Buffer | string>
}

export type ApiResponse = {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

export class InputError extends Error {}

const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? ''
const secretKey = process.env.SUPABASE_SECRET_KEY ?? ''
const resendKey = process.env.RESEND_API_KEY ?? ''
const fromEmail = process.env.RESEND_FROM_EMAIL || 'FreshPoint <onboarding@resend.dev>'
const siteUrl = (process.env.SITE_URL || 'https://freshpoint-omega.vercel.app').replace(/\/+$/, '')
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

function layout(content: string) {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f4f8f5;font-family:Arial,Helvetica,sans-serif;color:#17301f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(22,101,52,.08);">
<tr><td style="background:#166534;padding:22px 28px;">
<img src="${logoUrl}" alt="FreshPoint" width="150" style="display:block;max-width:150px;height:auto;border:0;" />
<p style="margin:10px 0 0;color:#dcfce7;font-size:12px;letter-spacing:.12em;text-transform:uppercase;">Your everyday fresh market</p>
</td></tr>
<tr><td style="padding:32px 28px;">${content}</td></tr>
<tr><td style="background:#f0fdf4;padding:20px 28px;color:#4b6b55;font-size:12px;line-height:1.6;">
<strong>FreshPoint</strong> · Fresh vegetables, fruits, grains and everyday essentials delivered in Juba, South Sudan.<br />
A OnePlan Enterprise brand · OrganicPoint / FreshPoint
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#166534;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;font-size:15px;">${escapeHtml(label)}</a>`
}

export async function sendConfirmationEmail(email: string, name: string, code: string) {
  const content = `
<h1 style="margin:0 0 16px;font-size:24px;color:#166534;">Confirm your email</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(name)}, use the code below to finish creating your FreshPoint account.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;"><tr><td style="padding:18px 26px;font-family:courier,monospace;font-size:30px;letter-spacing:8px;color:#14532d;font-weight:bold;">${code}</td></tr></table>
<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#4b6b55;">This code expires in 10 minutes. If you did not sign up, you can safely ignore this email.</p>`
  await sendEmail(email, 'Your FreshPoint confirmation code', layout(content))
}

export async function sendWelcomeEmail(email: string, name: string) {
  const content = `
<img src="${heroUrl}" alt="Fresh produce at a market" width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:12px;margin-bottom:22px;" />
<h1 style="margin:0 0 14px;font-size:26px;color:#166534;">Welcome to FreshPoint, ${escapeHtml(name)}!</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Your account is ready. Browse quality-checked vegetables, fruits, grains and everyday essentials, then get them delivered to your door in Juba.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;">You can log in with your email, your username, or the phone number you added — whichever is easiest for you.</p>
${button(`${siteUrl}/login`, 'Start shopping')}`
  await sendEmail(email, 'Welcome to FreshPoint 🎉', layout(content))
}

export async function sendPasswordResetEmail(email: string, name: string, code: string) {
  const resetUrl = `${siteUrl}/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
  const content = `
<h1 style="margin:0 0 16px;font-size:24px;color:#166534;">Reset your password</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.7;">Hi ${escapeHtml(name)}, we received a request to reset your FreshPoint password. Use the code below or the button to choose a new one.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;"><tr><td style="padding:18px 26px;font-family:courier,monospace;font-size:30px;letter-spacing:8px;color:#14532d;font-weight:bold;">${code}</td></tr></table>
<p style="margin:0 0 22px;">${button(resetUrl, 'Reset password')}</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#4b6b55;">This code expires in 10 minutes and can be used once. If you did not request a reset, you can ignore this email — your password will stay unchanged.</p>`
  await sendEmail(email, 'Reset your FreshPoint password', layout(content))
}

export async function sendPasswordChangedEmail(email: string, name: string) {
  const content = `
<h1 style="margin:0 0 16px;font-size:24px;color:#166534;">Password updated</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.7;">Hi ${escapeHtml(name)}, your FreshPoint password has just been changed.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;">You can now log in with your email, username or phone number and your new password.</p>
${button(`${siteUrl}/login`, 'Go to login')}
<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#4b6b55;">If this wasn’t you, contact FreshPoint support immediately.</p>`
  await sendEmail(email, 'Your FreshPoint password was changed', layout(content))
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
