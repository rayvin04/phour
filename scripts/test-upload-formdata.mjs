import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const bucketId = process.env.APPWRITE_BUCKET_FILES

// Test 1: client FormData with fileId and file
const form = new FormData()
form.append('fileId', 'unique()')
form.append('file', new Blob(['test content 123'], { type: 'text/plain' }), 'hello.txt')

const res = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
  method: 'POST',
  headers: {
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': apiKey,
    'X-Appwrite-Response-Format': '1.9.6'
  },
  body: form
})
console.log('Status with fileId in FormData:', res.status)
const data = await res.json()
console.log('Response:', data.$id, data.name)

// Clean up
if (data.$id) {
  await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${data.$id}`, {
    method: 'DELETE',
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  })
  console.log('Cleaned up file')
}
