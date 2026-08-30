import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID
const collectionId = process.env.APPWRITE_COLLECTION_FILES
const bucketId = process.env.APPWRITE_BUCKET_FILES

const headers = {
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'X-Appwrite-Response-Format': '1.9.6'
}

const testUser = 'user_3IXvktd9iBJ34pkBvnqPt3MutUa'

// Test query list for this user
const query = JSON.stringify({ method: 'equal', attribute: 'userId', values: [testUser] })
const params = new URLSearchParams({ total: 'false' })
params.append('queries[]', query)

const listRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?${params}`, {
  headers: { ...headers, 'Content-Type': 'application/json' }
})
const listData = await listRes.json()
console.log(`Documents returned for user ${testUser}:`, listData.documents?.length)
for (const doc of listData.documents || []) {
  console.log(`Document ${doc.$id}: filename="${doc.filename}", storageFileId="${doc.storageFileId}", bucketId="${doc.bucketId}"`)
  
  // Test preview endpoint from storage
  const prevUrl = `${endpoint}/storage/buckets/${doc.bucketId}/files/${doc.storageFileId}/preview`
  const prevRes = await fetch(prevUrl, { headers })
  console.log(`  /preview status: ${prevRes.status} (${prevRes.headers.get('content-type')})`)
  
  // Test view endpoint from storage
  const viewUrl = `${endpoint}/storage/buckets/${doc.bucketId}/files/${doc.storageFileId}/view`
  const viewRes = await fetch(viewUrl, { headers })
  console.log(`  /view status: ${viewRes.status} (${viewRes.headers.get('content-type')})`)
}
