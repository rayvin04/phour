import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID
const collectionId = process.env.APPWRITE_COLLECTION_FILES

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'X-Appwrite-Response-Format': '1.9.6'
}

console.log('Testing query on collection:', collectionId)

// Test 1: As currently written in base.repository.ts:
const query1 = `equal("userId", ["test_user"])`
const params1 = new URLSearchParams({ total: 'false' })
params1.append('queries[]', query1)

const url1 = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?${params1}`
console.log('URL 1:', url1)
try {
  const res1 = await fetch(url1, { headers })
  console.log('Res 1 status:', res1.status)
  const body1 = await res1.json()
  console.log('Res 1 body:', body1)
} catch (e) {
  console.error('Res 1 error:', e)
}

// Test 2: Appwrite Query SDK standard format.
// In Appwrite, Query.equal('userId', ['test_user']) or Query.equal('userId', 'test_user')?
// Let's test different query strings:
const testQueries = [
  'equal("userId", ["test_user"])',
  'equal("userId", "test_user")',
  '{"method":"equal","attribute":"userId","values":["test_user"]}',
  'equal("userId", ["test_user"])',
  // URLSearchParams query param name: 'queries[0]' vs 'queries[]' vs 'queries'
]

for (const q of testQueries) {
  console.log('\n--- Testing query format:', q)
  // try with queries[0]
  const p = new URLSearchParams()
  p.append('queries[0]', q)
  const u = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?${p}`
  const res = await fetch(u, { headers })
  const b = await res.json()
  console.log('queries[0] result:', res.status, b.message || (b.documents ? `success (${b.documents.length})` : b))
  
  // try with queries[]
  const p2 = new URLSearchParams()
  p2.append('queries[]', q)
  const u2 = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?${p2}`
  const res2 = await fetch(u2, { headers })
  const b2 = await res2.json()
  console.log('queries[] result:', res2.status, b2.message || (b2.documents ? `success (${b2.documents.length})` : b2))
}
