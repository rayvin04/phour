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

// 1. Upload to storage: Appwrite requires multipart form data with fileId field or query param?
// Let's test standard FormData upload using node FormData / Blob
const fileContent = 'Hello Phour World!'
const filename = 'test-doc.txt'

const form = new FormData()
form.append('fileId', 'unique()')
form.append('file', new Blob([fileContent], { type: 'text/plain' }), filename)

const uploadRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
  method: 'POST',
  headers: {
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': apiKey,
    'X-Appwrite-Response-Format': '1.9.6'
  },
  body: form
})
console.log('Upload HTTP status:', uploadRes.status)
const uploadedFile = await uploadRes.json()
console.log('Upload response:', uploadedFile)

// 2. Doc create
if (uploadedFile.$id) {
  const testUserId = 'user_test_phour_verification'
  const metadataPayload = {
    documentId: 'unique()',
    data: {
      userId: testUserId,
      filename: filename,
      originalFilename: filename,
      mimeType: 'text/plain',
      size: Buffer.byteLength(fileContent),
      bucketId: bucketId,
      storageFileId: uploadedFile.$id,
      uploadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      isPermanent: false,
      previewUrl: ''
    }
  }

  const docRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadataPayload)
  })
  console.log('Doc create HTTP status:', docRes.status)
  const doc = await docRes.json()
  console.log('Doc create response:', doc)
}
