import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID

const collections = {
  tasks: process.env.APPWRITE_COLLECTION_TASKS,
  projects: process.env.APPWRITE_COLLECTION_PROJECTS,
  habits: process.env.APPWRITE_COLLECTION_HABITS,
  categories: process.env.APPWRITE_COLLECTION_CATEGORIES,
  tags: process.env.APPWRITE_COLLECTION_TAGS,
  focusSessions: process.env.APPWRITE_COLLECTION_FOCUS_SESSIONS,
  files: process.env.APPWRITE_COLLECTION_FILES,
  settings: process.env.APPWRITE_COLLECTION_SETTINGS,
}

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'X-Appwrite-Response-Format': '1.9.6'
}

const Query = {
  equal: (attribute, value) => JSON.stringify({ method: 'equal', attribute, values: Array.isArray(value) ? value : [value] })
}

const testUserId = 'audit_user_' + Date.now()

async function audit() {
  console.log(`\n======================================================`)
  console.log(`Auditing Appwrite Persistence for All 8 Core Modules`)
  console.log(`User: ${testUserId}`)
  console.log(`======================================================\n`)

  const testData = {
    tasks: { title: 'Audit Test Task', priority: 'high', completed: false, archived: false, tagIds: ['study'] },
    projects: { name: 'Audit Project', archived: false, color: '#6c55d9' },
    habits: { title: 'Drink Water', frequency: 'daily', streak: 1, completedDates: ['2026-08-30'] },
    categories: { name: 'Academics', color: '#55c48a' },
    tags: { name: 'urgent', color: '#ff8b8b' },
    focusSessions: { duration: 1500, completed: true, startedAt: new Date().toISOString() },
    files: { filename: 'audit.txt', originalFilename: 'audit.txt', mimeType: 'text/plain', size: 10, bucketId: process.env.APPWRITE_BUCKET_FILES, storageFileId: 'audit_test_id', uploadedAt: new Date().toISOString(), isPermanent: false },
    settings: { theme: 'dark', timezone: 'Asia/Manila', preferences: '{"sound":true}' }
  }

  const createdDocs = {}

  // 1. CREATE Phase
  console.log('--- 1. Testing Creation ---')
  for (const [key, colId] of Object.entries(collections)) {
    const payload = {
      documentId: 'unique()',
      data: {
        ...testData[key],
        userId: testUserId
      }
    }
    const res = await fetch(`${endpoint}/databases/${databaseId}/collections/${colId}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      throw new Error(`Failed creating ${key}: ${res.status} ${await res.text()}`)
    }
    const doc = await res.json()
    createdDocs[key] = doc
    console.log(`  ✅ ${key} created successfully (id: ${doc.$id})`)
  }

  // 2. QUERY / REFRESH Simulation Phase
  console.log('\n--- 2. Testing Query Persistence (Simulating Page Refresh) ---')
  for (const [key, colId] of Object.entries(collections)) {
    const params = new URLSearchParams({ total: 'false' })
    params.append('queries[]', Query.equal('userId', testUserId))
    const res = await fetch(`${endpoint}/databases/${databaseId}/collections/${colId}/documents?${params}`, {
      headers
    })
    if (!res.ok) {
      throw new Error(`Failed querying ${key}: ${res.status} ${await res.text()}`)
    }
    const list = await res.json()
    if (!list.documents || list.documents.length === 0) {
      throw new Error(`Persistence verification failed for ${key}: 0 documents found on refresh!`)
    }
    console.log(`  ✅ ${key} verified on refresh (found ${list.documents.length} doc, ID matched: ${list.documents[0].$id === createdDocs[key].$id})`)
  }

  // 3. CLEANUP Phase
  console.log('\n--- 3. Cleaning Up Test Documents ---')
  for (const [key, colId] of Object.entries(collections)) {
    const docId = createdDocs[key].$id
    const res = await fetch(`${endpoint}/databases/${databaseId}/collections/${colId}/documents/${docId}`, {
      method: 'DELETE',
      headers
    })
    if (!res.ok && res.status !== 204) {
      console.warn(`  ⚠️ Cleanup warning for ${key}: ${res.status}`)
    } else {
      console.log(`  ✅ ${key} test document deleted`)
    }
  }

  console.log(`\n🎉 PERSISTENCE AUDIT COMPLETE: ALL 8 MODULES PERSIST RELIABLY TO APPWRITE!\n`)
}

await audit()
