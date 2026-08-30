#!/usr/bin/env node
// Retry creating missing Appwrite indexes for Phour

import fs from 'fs'
import path from 'path'
import process from 'process'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found in project root.')
  process.exit(1)
}
dotenv.config({ path: envPath })

const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'APPWRITE_DATABASE_ID']
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '))
  process.exit(1)
}

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

async function request(path, options = {}) {
  const url = `${endpoint}${path}`
  const res = await fetch(url, { headers, ...options })
  const text = await res.text().catch(() => '')
  let body;
  try { body = text ? JSON.parse(text) : {} } catch (e) { body = text }
  if (!res.ok) {
    const err = typeof body === 'string' ? body : JSON.stringify(body)
    throw { status: res.status, statusText: res.statusText, body: err }
  }
  if (res.status === 204) return null
  return body
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

// Define required indexes for collections (matching APPWRITE_SCHEMA.md)
const collectionsDef = [
  { name: 'users', indexes: [{ key: 'userId', attributes: ['userId'], orders: ['ASC'], type: 'key', unique: true }] },
  { name: 'projects', indexes: [{ key: 'userId_archived', attributes: ['userId','archived'], orders: ['ASC','ASC'], type: 'key' }] },
  { name: 'tasks', indexes: [
    { key: 'tasks_userId', attributes: ['userId'], orders: ['ASC'], type: 'key' },
    { key: 'tasks_completed', attributes: ['completed'], orders: ['ASC'], type: 'key' },
    { key: 'tasks_archived', attributes: ['archived'], orders: ['ASC'], type: 'key' },
    { key: 'tasks_dueDate', attributes: ['dueDate'], orders: ['ASC'], type: 'key' },
    { key: 'tasks_projectId', attributes: ['projectId'], orders: ['ASC'], type: 'key' }
  ] },
  { name: 'subtasks', indexes: [{ key: 'subtasks_user_task', attributes: ['userId','taskId'], orders: ['ASC','ASC'], type: 'key' }] },
  { name: 'tags', indexes: [{ key: 'tags_user_name', attributes: ['userId','name'], orders: ['ASC','ASC'], type: 'key' }] },
  { name: 'categories', indexes: [{ key: 'categories_user_name', attributes: ['userId','name'], orders: ['ASC','ASC'], type: 'key' }] },
  { name: 'focus_sessions', indexes: [{ key: 'focus_user_startedAt', attributes: ['userId','startedAt'], orders: ['ASC','DESC'], type: 'key' }] },
  { name: 'habits', indexes: [{ key: 'habits_user', attributes: ['userId'], orders: ['ASC'], type: 'key' }] },
  { name: 'settings', indexes: [{ key: 'settings_user', attributes: ['userId'], orders: ['ASC'], type: 'key', unique: true }] },
  { name: 'activity_log', indexes: [{ key: 'activity_user_timestamp', attributes: ['userId','timestamp'], orders: ['ASC','DESC'], type: 'key' }] }
]

async function main() {
  try {
    console.log('Listing existing collections...')
    const existing = await request(`/databases/${databaseId}/collections`)
    const existingMap = new Map(existing.collections.map((c) => [c.name, c]))

    const results = []

    for (const col of collectionsDef) {
      const existingCol = existingMap.get(col.name)
      if (!existingCol) {
        console.warn(`Collection ${col.name} does not exist. Skipping.`)
        results.push({ collection: col.name, status: 'missing_collection' })
        continue
      }
      const colId = existingCol.$id
      // list existing indexes
      const idxList = await request(`/databases/${databaseId}/collections/${colId}/indexes`)
      const existingIdxKeys = idxList.indexes.map((i) => i.key)

      for (const idx of col.indexes) {
        if (existingIdxKeys.includes(idx.key)) {
          console.log(`Index exists: ${col.name} -> ${idx.key}`)
          continue
        }
        console.log(`Index missing: ${col.name} -> ${idx.key} (will retry)`)
        let created = false
        const maxAttempts = 10
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            await request(`/databases/${databaseId}/collections/${colId}/indexes`, { method: 'POST', body: JSON.stringify({ key: idx.key, type: idx.type || 'key', attributes: idx.attributes, orders: idx.orders, unique: idx.unique || false }) })
            console.log(`Created index ${idx.key} on ${col.name}`)
            created = true
            break
          } catch (err) {
            const body = err.body || ''
            if (String(body).includes('attribute_not_available')) {
              console.log(`Attribute not available for ${idx.key} on ${col.name}. Attempt ${attempt}/${maxAttempts}. Waiting...`)
              await sleep(2000)
              continue
            }
            console.error(`Index creation failed for ${idx.key} on ${col.name}:`, err)
            break
          }
        }
        results.push({ collection: col.name, index: idx.key, created })
      }
    }

    const failures = results.filter((r) => r.created !== true && r.status !== 'missing_collection')
    if (failures.length === 0) {
      console.log('All required indexes are present or created')
    } else {
      console.warn('Some indexes could not be created:', failures)
    }

    // final verification: list indexes for each collection
    for (const col of collectionsDef) {
      const existingCol = existingMap.get(col.name)
      if (!existingCol) continue
      const idxList = await request(`/databases/${databaseId}/collections/${existingCol.$id}/indexes`)
      console.log(`Indexes for ${col.name}:`, idxList.indexes.map(i => i.key).join(', '))
    }

    // verify CRUD on tasks
    const tasksCol = existingMap.get('tasks')
    if (tasksCol) {
      console.log('Verifying CRUD on tasks...')
      const temp = await request(`/databases/${databaseId}/collections/${tasksCol.$id}/documents`, { method: 'POST', body: JSON.stringify({ documentId: 'unique()', data: { userId: 'provision_test_user', title: 'temp', completed: false, archived: false, priority: 'low', tagIds: [] } }) })
      console.log('Created temp document id=', temp.$id)
      await request(`/databases/${databaseId}/collections/${tasksCol.$id}/documents/${temp.$id}`, { method: 'DELETE' })
      console.log('Deleted temp document')
    }

    process.exit(0)
  } catch (err) {
    console.error('Retry-indexes failed:', err)
    process.exit(1)
  }
}

main()
