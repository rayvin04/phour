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

console.log('Testing Appwrite storage endpoints for different file types...')

// 1. Upload a 1x1 PNG image
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const pngBuffer = Buffer.from(pngBase64, 'base64')
const pngForm = new FormData()
pngForm.append('fileId', 'unique()')
pngForm.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'test.png')

const pngRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
  method: 'POST',
  headers,
  body: pngForm
})
const pngDoc = await pngRes.json()
console.log('Uploaded PNG:', pngDoc.$id)

// Test preview and view for PNG
const pngPreviewRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${pngDoc.$id}/preview`, { headers })
console.log('PNG /preview status:', pngPreviewRes.status, pngPreviewRes.headers.get('content-type'))

const pngViewRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${pngDoc.$id}/view`, { headers })
console.log('PNG /view status:', pngViewRes.status, pngViewRes.headers.get('content-type'))

// 2. Upload a text/PDF file
const textForm = new FormData()
textForm.append('fileId', 'unique()')
textForm.append('file', new Blob(['Sample text file'], { type: 'text/plain' }), 'sample.txt')

const textRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
  method: 'POST',
  headers,
  body: textForm
})
const textDoc = await textRes.json()
console.log('\nUploaded Text:', textDoc.$id)

// Test preview and view for Text
const textPreviewRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${textDoc.$id}/preview`, { headers })
console.log('Text /preview status:', textPreviewRes.status, textPreviewRes.headers.get('content-type'))

const textViewRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${textDoc.$id}/view`, { headers })
console.log('Text /view status:', textViewRes.status, textViewRes.headers.get('content-type'))

// 3. Upload a PDF
const pdfForm = new FormData()
pdfForm.append('fileId', 'unique()')
pdfForm.append('file', new Blob(['%PDF-1.4 ...'], { type: 'application/pdf' }), 'sample.pdf')

const pdfRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
  method: 'POST',
  headers,
  body: pdfForm
})
const pdfDoc = await pdfRes.json()
console.log('\nUploaded PDF:', pdfDoc.$id)

const pdfPreviewRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${pdfDoc.$id}/preview`, { headers })
console.log('PDF /preview status:', pdfPreviewRes.status, pdfPreviewRes.headers.get('content-type'))

const pdfViewRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${pdfDoc.$id}/view`, { headers })
console.log('PDF /view status:', pdfViewRes.status, pdfViewRes.headers.get('content-type'))

// Clean up test files
for (const id of [pngDoc.$id, textDoc.$id, pdfDoc.$id]) {
  if (id) {
    await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${id}`, { method: 'DELETE', headers })
  }
}
console.log('\nCleaned up test files.')
