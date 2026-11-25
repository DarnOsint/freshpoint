import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  AuthError, ForbiddenError, InputError, requireAdmin, send,
  type ApiRequest, type ApiResponse,
} from '../server/freshpoint.js'

export const config = {
  api: { bodyParser: false },
}

const MAX_BYTES = 4 * 1024 * 1024
const imageTypes: Record<string, { extension: string; signature: number[] }> = {
  'image/jpeg': { extension: 'jpg', signature: [0xff, 0xd8, 0xff] },
  'image/png': { extension: 'png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  'image/webp': { extension: 'webp', signature: [0x52, 0x49, 0x46, 0x46] },
}

function hasSignature(buffer: Buffer, signature: number[]) {
  return buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte)
}

async function readImage(req: ApiRequest): Promise<{ buffer: Buffer; contentType: string }> {
  const rawType = req.headers['content-type']
  const contentType = (Array.isArray(rawType) ? rawType[0] : rawType ?? '').split(';')[0].trim().toLowerCase()
  if (!imageTypes[contentType]) throw new InputError('Choose a JPEG, PNG or WebP image.')

  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    size += buffer.length
    if (size > MAX_BYTES) throw new InputError('Images must be smaller than 4 MB.')
    chunks.push(buffer)
  }
  if (!size) throw new InputError('Choose an image to upload.')

  const buffer = Buffer.concat(chunks)
  if (!hasSignature(buffer, imageTypes[contentType].signature)) {
    throw new InputError('That file is not a valid image.')
  }
  if (contentType === 'image/webp' && buffer.subarray(8, 12).toString() !== 'WEBP') {
    throw new InputError('That file is not a valid image.')
  }
  return { buffer, contentType }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

    await requireAdmin(req)

    const accountId = process.env.R2_ACCOUNT_ID
    const bucket = process.env.R2_BUCKET
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const publicBase = (process.env.VITE_R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '')
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('Image storage is not configured')
    }

    const url = new URL(req.url ?? '', 'http://localhost')
    const folder = url.searchParams.get('folder') ?? 'products'
    if (folder !== 'products' && folder !== 'brand') throw new InputError('Choose a valid image folder.')

    const { buffer, contentType } = await readImage(req)
    const extension = imageTypes[contentType].extension
    const key = `${folder}/${randomUUID()}.${extension}`

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }))

    return send(res, 200, { ok: true, key, url: publicBase ? `${publicBase}/${key}` : null })
  } catch (error) {
    if (error instanceof AuthError || error instanceof ForbiddenError) {
      return send(res, error instanceof AuthError ? 401 : 403, { error: error.message })
    }
    if (error instanceof InputError) return send(res, 400, { error: error.message })
    console.error('Upload API failed:', error)
    return send(res, 500, { error: 'We could not upload the image. Please try again.' })
  }
}
