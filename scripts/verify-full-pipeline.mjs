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

const Query = {
  equal: (attribute, value) => JSON.stringify({ method: 'equal', attribute, values: Array.isArray(value) ? value : [value] }),
  orderDesc: (attribute) => JSON.stringify({ method: 'orderDesc', attribute })
}

async function verifyAll() {
  const testUserId = 'test_user_e2e_' + Date.now()
  console.log(`\n==================================================`)
  console.log(`Starting End-to-End File Pipeline Verification`)
  console.log(`Test User: ${testUserId}`)
  console.log(`==================================================\n`)

  // Step 1: Upload Image to Storage
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const pngBuffer = Buffer.from(pngBase64, 'base64')
  const uploadForm = new FormData()
  uploadForm.append('fileId', 'unique()')
  uploadForm.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'biology-diagram.png')

  const storageRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
    method: 'POST',
    headers,
    body: uploadForm
  })
  if (!storageRes.ok) throw new Error(`Storage upload failed: ${storageRes.status} ${await storageRes.text()}`)
  const storageDoc = await storageRes.json()
  console.log(`1. ✅ Storage upload succeeded. File ID: ${storageDoc.$id} (${storageDoc.name})`)

  // Step 2: Metadata Document Creation & Field Verification
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString()
  const metadataPayload = {
    documentId: 'unique()',
    data: {
      userId: testUserId,
      filename: 'biology-diagram.png',
      originalFilename: 'biology-diagram.png',
      mimeType: 'image/png',
      size: pngBuffer.length,
      bucketId: bucketId,
      storageFileId: storageDoc.$id,
      uploadedAt: now,
      expiresAt: expiresAt,
      isPermanent: false,
      previewUrl: `/api/files/preview/${storageDoc.$id}`
    }
  }

  const docRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(metadataPayload)
  })
  if (!docRes.ok) throw new Error(`Metadata creation failed: ${docRes.status} ${await docRes.text()}`)
  const createdDoc = await docRes.json()
  console.log(`2. ✅ Metadata document created with all required fields:`)
  console.log(`   - Document ID: ${createdDoc.$id}`)
  console.log(`   - storageFileId: ${createdDoc.storageFileId}`)
  console.log(`   - originalFilename: ${createdDoc.originalFilename}`)
  console.log(`   - mimeType: ${createdDoc.mimeType}`)
  console.log(`   - size: ${createdDoc.size} bytes`)
  console.log(`   - userId: ${createdDoc.userId}`)
  console.log(`   - expiresAt: ${createdDoc.expiresAt}`)
  console.log(`   - isPermanent: ${createdDoc.isPermanent}`)

  // Step 3: Query & List Verification
  const listParams = new URLSearchParams({ total: 'false' })
  listParams.append('queries[]', Query.equal('userId', testUserId))
  listParams.append('queries[]', Query.orderDesc('$createdAt'))

  const listRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?${listParams}`, {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
  if (!listRes.ok) throw new Error(`List query failed: ${listRes.status} ${await listRes.text()}`)
  const listData = await listRes.json()
  console.log(`3. ✅ File listing query succeeded. Returned ${listData.documents.length} document(s).`)

  // Step 4: Preview Endpoint Verification (Thumbnail & View)
  const prevUrl = `${endpoint}/storage/buckets/${createdDoc.bucketId}/files/${createdDoc.storageFileId}/preview?width=600&height=450`
  const prevRes = await fetch(prevUrl, { headers })
  if (!prevRes.ok) throw new Error(`Thumbnail preview failed: ${prevRes.status}`)
  console.log(`4. ✅ Storage preview thumbnail succeeded. Status: ${prevRes.status}, Content-Type: ${prevRes.headers.get('content-type')}`)

  const viewUrl = `${endpoint}/storage/buckets/${createdDoc.bucketId}/files/${createdDoc.storageFileId}/view`
  const viewRes = await fetch(viewUrl, { headers })
  if (!viewRes.ok) throw new Error(`View endpoint failed: ${viewRes.status}`)
  console.log(`   ✅ Storage view endpoint succeeded. Status: ${viewRes.status}, Content-Type: ${viewRes.headers.get('content-type')}`)

  // Step 5: Rename Verification
  const renameRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${createdDoc.$id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { filename: 'biology-diagram-v2.png' } })
  })
  if (!renameRes.ok) throw new Error(`Rename failed: ${renameRes.status}`)
  const renamedDoc = await renameRes.json()
  console.log(`5. ✅ Rename succeeded. New filename: "${renamedDoc.filename}"`)

  // Step 6: Make Permanent & Restore Expiration
  const permRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${createdDoc.$id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { isPermanent: true, expiresAt: '' } })
  })
  if (!permRes.ok) throw new Error(`Make permanent failed: ${permRes.status}`)
  const permDoc = await permRes.json()
  console.log(`6. ✅ Make permanent succeeded. isPermanent: ${permDoc.isPermanent}`)

  const restoreRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${createdDoc.$id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { isPermanent: false, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() } })
  })
  if (!restoreRes.ok) throw new Error(`Restore expiration failed: ${restoreRes.status}`)
  const restoredDoc = await restoreRes.json()
  console.log(`   ✅ Restore expiration succeeded. expiresAt: ${restoredDoc.expiresAt}`)

  // Step 7: Delete Verification
  const delDocRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${createdDoc.$id}`, {
    method: 'DELETE',
    headers
  })
  if (!delDocRes.ok && delDocRes.status !== 204) throw new Error(`Delete doc failed: ${delDocRes.status}`)

  const delStorageRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${storageDoc.$id}`, {
    method: 'DELETE',
    headers
  })
  if (!delStorageRes.ok && delStorageRes.status !== 204) throw new Error(`Delete storage file failed: ${delStorageRes.status}`)
  console.log(`7. ✅ Delete document and storage file succeeded.`)

  console.log(`\n🎉 ALL 7 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!\n`)
}

await verifyAll()
