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

const r = await fetch(`${endpoint}/databases/${databaseId}/collections?total=true&limit=50`, { headers })
const d = await r.json()
if (d.collections) {
  for (const c of d.collections) {
    console.log(c.name + ' -> ' + c['$id'])
  }
} else {
  console.log(JSON.stringify(d))
}
