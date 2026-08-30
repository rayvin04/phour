import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const bucketId = process.env.APPWRITE_BUCKET_FILES

const headers = {
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'X-Appwrite-Response-Format': '1.9.6'
}

// Upload a dummy video and audio
const videoForm = new FormData()
videoForm.append('fileId', 'unique()')
videoForm.append('file', new Blob(['fake video data'], { type: 'video/mp4' }), 'sample.mp4')
const vRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, { method: 'POST', headers, body: videoForm })
const vDoc = await vRes.json()
console.log('Video uploaded:', vDoc.$id)

const vPrev = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${vDoc.$id}/preview`, { headers })
console.log('Video /preview status:', vPrev.status)

const vView = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${vDoc.$id}/view`, { headers })
console.log('Video /view status:', vView.status, vView.headers.get('content-type'))

// Cleanup
await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${vDoc.$id}`, { method: 'DELETE', headers })
