import dotenv from 'dotenv'
import { resolve } from 'path'
import { appendFileSync, readFileSync } from 'fs'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID
const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'X-Appwrite-Response-Format': '1.9.6'
}

async function req(path, options = {}) {
  const r = await fetch(`${endpoint}${path}`, { headers, ...options })
  if (r.status === 204) return null
  const body = await r.json()
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${JSON.stringify(body)}`)
  return body
}

// 1. Create the files collection
console.log('Creating files collection...')
const collectionId = 'files_' + Math.random().toString(36).slice(2, 10)
const col = await req(`/databases/${databaseId}/collections`, {
  method: 'POST',
  body: JSON.stringify({ collectionId, name: 'files', read: [], write: [] })
})
const cId = col['$id']
console.log('Created files collection:', cId)

// 2. Create attributes
const stringAttrs = [
  { key: 'userId', required: true },
  { key: 'filename', required: true },
  { key: 'originalFilename', required: false },
  { key: 'mimeType', required: true },
  { key: 'bucketId', required: true },
  { key: 'storageFileId', required: true },
  { key: 'uploadedAt', required: true },
  { key: 'expiresAt', required: false },
  { key: 'previewUrl', required: false },
]
const boolAttrs = [
  { key: 'isPermanent', required: true },
]
const intAttrs = [
  { key: 'size', required: true },
]

for (const a of stringAttrs) {
  console.log('Creating string attr:', a.key)
  await req(`/databases/${databaseId}/collections/${cId}/attributes/string`, {
    method: 'POST',
    body: JSON.stringify({ key: a.key, size: 512, required: a.required })
  }).catch(e => console.error('  Failed:', e.message))
}
for (const a of boolAttrs) {
  console.log('Creating boolean attr:', a.key)
  await req(`/databases/${databaseId}/collections/${cId}/attributes/boolean`, {
    method: 'POST',
    body: JSON.stringify({ key: a.key, required: a.required })
  }).catch(e => console.error('  Failed:', e.message))
}
for (const a of intAttrs) {
  console.log('Creating integer attr:', a.key)
  await req(`/databases/${databaseId}/collections/${cId}/attributes/integer`, {
    method: 'POST',
    body: JSON.stringify({ key: a.key, required: a.required })
  }).catch(e => console.error('  Failed:', e.message))
}

// 3. Wait a moment for attributes to be processed, then create indexes
console.log('Waiting 5s for attributes...')
await new Promise(r => setTimeout(r, 5000))

console.log('Creating index on userId...')
await req(`/databases/${databaseId}/collections/${cId}/indexes`, {
  method: 'POST',
  body: JSON.stringify({ key: 'files_userId', type: 'key', attributes: ['userId'], orders: ['ASC'] })
}).catch(e => console.error('Index failed:', e.message))

// 4. Write to .env.local
const envLine = `\nAPPWRITE_COLLECTION_FILES=${cId}\n`
appendFileSync(resolve(process.cwd(), '.env.local'), envLine)
console.log('Written to .env.local: APPWRITE_COLLECTION_FILES=' + cId)

// 5. Fix the FOCUSSESSIONS key name mismatch
const envPath = resolve(process.cwd(), '.env.local')
let envContent = readFileSync(envPath, 'utf8')
const hasFocusSessions = envContent.includes('APPWRITE_COLLECTION_FOCUS_SESSIONS=')
if (!hasFocusSessions) {
  // replace FOCUSSESSIONS with FOCUS_SESSIONS
  const fixed = envContent.replace(/APPWRITE_COLLECTION_FOCUSSESSIONS=/g, 'APPWRITE_COLLECTION_FOCUS_SESSIONS=')
  const { writeFileSync } = await import('fs')
  writeFileSync(envPath, fixed, 'utf8')
  console.log('Fixed APPWRITE_COLLECTION_FOCUS_SESSIONS key name in .env.local')
} else {
  console.log('APPWRITE_COLLECTION_FOCUS_SESSIONS already correct')
}

console.log('Done!')
