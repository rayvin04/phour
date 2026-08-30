import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID
const collectionId = process.env.APPWRITE_FILES || process.env.APPWRITE_COLLECTION_FILES

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'X-Appwrite-Response-Format': '1.9.6'
}

export const Query = {
  equal: (attribute, value) => JSON.stringify({ method: 'equal', attribute, values: Array.isArray(value) ? value : [value] }),
  notEqual: (attribute, value) => JSON.stringify({ method: 'notEqual', attribute, values: Array.isArray(value) ? value : [value] }),
  lessThan: (attribute, value) => JSON.stringify({ method: 'lessThan', attribute, values: Array.isArray(value) ? value : [value] }),
  lessThanEqual: (attribute, value) => JSON.stringify({ method: 'lessThanEqual', attribute, values: Array.isArray(value) ? value : [value] }),
  greaterThan: (attribute, value) => JSON.stringify({ method: 'greaterThan', attribute, values: Array.isArray(value) ? value : [value] }),
  greaterThanEqual: (attribute, value) => JSON.stringify({ method: 'greaterThanEqual', attribute, values: Array.isArray(value) ? value : [value] }),
  search: (attribute, value) => JSON.stringify({ method: 'search', attribute, values: [value] }),
  isNull: (attribute) => JSON.stringify({ method: 'isNull', attribute }),
  isNotNull: (attribute) => JSON.stringify({ method: 'isNotNull', attribute }),
  orderAsc: (attribute) => JSON.stringify({ method: 'orderAsc', attribute }),
  orderDesc: (attribute) => JSON.stringify({ method: 'orderDesc', attribute }),
  limit: (limit) => JSON.stringify({ method: 'limit', values: [limit] }),
  offset: (offset) => JSON.stringify({ method: 'offset', values: [offset] }),
}

const queriesToTest = [
  Query.equal('userId', 'user_test_123'),
  Query.limit(25),
  Query.orderDesc('$createdAt'),
]

const params = new URLSearchParams({ total: 'false' })
for (const q of queriesToTest) {
  params.append('queries[]', q)
}

const url = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?${params}`
console.log('Sending URL:', url)
const res = await fetch(url, { headers })
console.log('Status:', res.status)
const body = await res.json()
console.log('Body:', body)
