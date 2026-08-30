import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '')
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'X-Appwrite-Response-Format': '1.9.6'
}

async function inspectCollections() {
  const r = await fetch(`${endpoint}/databases/${databaseId}/collections?limit=50`, { headers })
  const d = await r.json()
  for (const c of d.collections) {
    console.log(`\n========================================`)
    console.log(`Collection: ${c.name} (id: ${c.$id})`)
    console.log(`Attributes (${c.attributes.length}):`)
    for (const a of c.attributes) {
      console.log(`  - ${a.key} (${a.type}, required: ${a.required}, status: ${a.status})`)
    }
    console.log(`Indexes (${c.indexes.length}):`)
    for (const i of c.indexes) {
      console.log(`  - ${i.key} (type: ${i.type}, attributes: ${i.attributes.join(', ')}, status: ${i.status})`)
    }
  }
}

await inspectCollections()
