import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID

const collections = {
  users: process.env.APPWRITE_COLLECTION_USERS,
  projects: process.env.APPWRITE_COLLECTION_PROJECTS,
  tasks: process.env.APPWRITE_COLLECTION_TASKS,
  subtasks: process.env.APPWRITE_COLLECTION_SUBTASKS,
  tags: process.env.APPWRITE_COLLECTION_TAGS,
  categories: process.env.APPWRITE_COLLECTION_CATEGORIES,
  focusSessions: process.env.APPWRITE_COLLECTION_FOCUS_SESSIONS,
  habits: process.env.APPWRITE_COLLECTION_HABITS,
  settings: process.env.APPWRITE_COLLECTION_SETTINGS,
  activityLog: process.env.APPWRITE_COLLECTION_ACTIVITY_LOG,
  files: process.env.APPWRITE_COLLECTION_FILES
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

const testUserId = 'user_audit_check_123'

console.log('Verifying list queries on all 11 collections...')
let allPassed = true

for (const [name, colId] of Object.entries(collections)) {
  if (!colId) {
    console.error(`❌ Collection ID missing for ${name}`)
    allPassed = false
    continue
  }
  const params = new URLSearchParams({ total: 'false' })
  params.append('queries[]', Query.equal('userId', testUserId))
  const url = `${endpoint}/databases/${databaseId}/collections/${colId}/documents?${params}`
  try {
    const res = await fetch(url, { headers })
    if (!res.ok) {
      const err = await res.json()
      console.error(`❌ ${name} (${colId}) query FAILED (${res.status}):`, err.message || err)
      allPassed = false
    } else {
      const data = await res.json()
      console.log(`✅ ${name} (${colId}): query SUCCESS (found ${data.documents.length})`)
    }
  } catch (e) {
    console.error(`❌ ${name} error:`, e.message)
    allPassed = false
  }
}

if (allPassed) {
  console.log('\n🎉 ALL 11 COLLECTIONS QUERIES PASSED WITH ZERO SYNTAX ERRORS!')
} else {
  console.error('\n⚠️ Some collections failed.')
  process.exit(1)
}
