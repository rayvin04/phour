import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID
const bucketId = process.env.APPWRITE_BUCKET_FILES
const collectionId = process.env.APPWRITE_COLLECTION_FILES

const headers = {
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'X-Appwrite-Response-Format': '1.9.6'
}

console.log('Querying current documents in files collection...')
const r = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents`, {
  headers: {
    ...headers,
    'Content-Type': 'application/json'
  }
})
const d = await r.json()
console.log(`Current documents count: ${d.total || d.documents?.length || 0}`)
if (d.documents) {
  for (const doc of d.documents) {
    console.log(`- ${doc.$id}: "${doc.filename}" (${doc.mimeType}, ${doc.size} bytes, user: ${doc.userId})`)
  }
}
