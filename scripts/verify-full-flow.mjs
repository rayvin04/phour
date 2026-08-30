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
}

async function runFullVerification() {
  const testUserId = 'test_user_flow_' + Date.now()
  console.log('Testing full user upload flow for:', testUserId)

  // 1. Upload to Storage
  const filename = 'sample-lecture-notes.pdf'
  const fileContent = 'PDF sample content for testing'
  const form = new FormData()
  form.append('fileId', 'unique()')
  form.append('file', new Blob([fileContent], { type: 'application/pdf' }), filename)

  const storageRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
    method: 'POST',
    headers,
    body: form
  })
  if (!storageRes.ok) throw new Error('Storage upload failed: ' + (await storageRes.text()))
  const storageDoc = await storageRes.json()
  console.log('1. ✅ Storage upload succeeded. File ID:', storageDoc.$id)

  // 2. Metadata Document Creation
  const metaData = {
    documentId: 'unique()',
    data: {
      userId: testUserId,
      filename: filename,
      originalFilename: filename,
      mimeType: 'application/pdf',
      size: Buffer.byteLength(fileContent),
      bucketId: bucketId,
      storageFileId: storageDoc.$id,
      uploadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      isPermanent: false,
      previewUrl: ''
    }
  }
  const createRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(metaData)
  })
  if (!createRes.ok) throw new Error('Doc create failed: ' + (await createRes.text()))
  const doc = await createRes.json()
  console.log('2. ✅ Metadata document created. Document ID:', doc.$id)

  // 3. Document Query / Listing
  const params = new URLSearchParams({ total: 'false' })
  params.append('queries[]', Query.equal('userId', testUserId))
  const listRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?${params}`, {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
  if (!listRes.ok) throw new Error('Query failed: ' + (await listRes.text()))
  const listData = await listRes.json()
  console.log(`3. ✅ Files list query succeeded. Found ${listData.documents.length} file(s). First: "${listData.documents[0]?.filename}"`)

  // 4. Rename
  const patchRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${doc.$id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { filename: 'renamed-lecture-notes.pdf' } })
  })
  if (!patchRes.ok) throw new Error('Rename failed: ' + (await patchRes.text()))
  const patched = await patchRes.json()
  console.log('4. ✅ Rename succeeded. New name:', patched.filename)

  // 5. Make Permanent
  const permRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${doc.$id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { isPermanent: true, expiresAt: '' } })
  })
  if (!permRes.ok) throw new Error('Make permanent failed: ' + (await permRes.text()))
  const permDoc = await permRes.json()
  console.log('5. ✅ Make permanent succeeded. isPermanent:', permDoc.isPermanent)

  // 6. Delete metadata & storage file
  const delDocRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${doc.$id}`, {
    method: 'DELETE',
    headers
  })
  if (!delDocRes.ok && delDocRes.status !== 204) throw new Error('Doc delete failed')
  
  const delFileRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${storageDoc.$id}`, {
    method: 'DELETE',
    headers
  })
  if (!delFileRes.ok && delFileRes.status !== 204) throw new Error('Storage file delete failed')
  console.log('6. ✅ Delete metadata and storage file succeeded.')

  console.log('\n🌟 ALL 6 END-TO-END FILE LIFECYCLE STEPS PASSED!')
}

await runFullVerification()
