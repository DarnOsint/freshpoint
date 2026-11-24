import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const ENV_FILE = new URL('../.env.local', import.meta.url)

async function loadEnv() {
  try {
    const text = await readFile(ENV_FILE, 'utf8')
    for (const line of text.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
    }
  } catch {
    // Credentials may be supplied by the shell instead.
  }
}

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

const args = process.argv.slice(2)
if (args.length < 2 || args.length % 2 !== 0) {
  console.error('Usage: npm run r2:upload -- <local-file> <object-key> [<local-file> <object-key> ...]')
  process.exit(1)
}

await loadEnv()

const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Missing R2 credentials. Add them to .env.local.')
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

for (let index = 0; index < args.length; index += 2) {
  const [localPath, objectKey] = args.slice(index, index + 2)
  const body = await readFile(localPath)
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey.replace(/^\/+/, ''),
    Body: body,
    ContentType: mimeTypes[extname(localPath).toLowerCase()] ?? 'application/octet-stream',
  }))
  console.log(`uploaded ${localPath} -> ${objectKey}`)
}
