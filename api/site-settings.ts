import {
  AuthError, ForbiddenError, InputError, adminFetch, readJson, recordAudit, requireAdmin, send,
  type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

const OBJECT_PATH = '/storage/v1/object/site/settings.json'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === 'GET') {
      const response = await adminFetch(OBJECT_PATH, { headers: { Accept: 'application/json' } })
      if (response.status === 404) return send(res, 200, null)
      if (!response.ok) throw new Error('Website content lookup failed')
      return send(res, 200, await response.json())
    }

    if (req.method === 'PUT') {
      const actor = await requireAdmin(req)
      const body = await readJson(req)
      if (!body.brand || !body.contact || !body.hero || !Array.isArray(body.navigation)) {
        throw new InputError('The website content is incomplete. Please try again.')
      }

      const response = await adminFetch(OBJECT_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-upsert': 'true',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        console.error('Website content save failed:', response.status, await response.text())
        throw new Error('Website content save failed')
      }
      await recordAudit(actor, 'website.save', 'website', 'site-settings', {
        sections: Object.keys(body),
      })
      return send(res, 200, { ok: true })
    }

    return send(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof AuthError || error instanceof ForbiddenError) {
      return send(res, error instanceof AuthError ? 401 : 403, { error: error.message })
    }
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Site settings API failed:', error)
    return send(res, 500, { error: 'We could not update the website content. Please try again.' })
  }
}
