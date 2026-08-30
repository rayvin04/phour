#!/usr/bin/env node
// Provision Appwrite backend for Phour
// Usage: node scripts/provision-appwrite.mjs

import fs from 'fs'
import path from 'path'
import process from 'process'
import { exit } from 'process'
import dotenv from 'dotenv'

// Load .env.local from project root
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.error('.env.local not found in project root. Create one with Appwrite credentials before running this script.')
  process.exit(1)
}

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
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${body}`)
  }
  if (res.status === 204) return null
  return res.json()
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

// Collections and schema from APPWRITE_SCHEMA.md (simplified)
const collections = [
  { key: 'users', name: 'users', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'displayName', type: 'string', required: false },
    { key: 'email', type: 'string', required: false }
  ], indexes: [{ key: 'userId', attributes: ['userId'], orders: ['ASC'] , type: 'key', unique: true }] },
  { key: 'projects', name: 'projects', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'name', type: 'string', required: true },
    { key: 'description', type: 'string', required: false },
    { key: 'color', type: 'string', required: false },
    { key: 'icon', type: 'string', required: false },
    { key: 'archived', type: 'boolean', required: true }
  ], indexes: [{ key: 'userId_archived', attributes: ['userId', 'archived'], orders: ['ASC','ASC'], type: 'key' }] },
  { key: 'tasks', name: 'tasks', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'title', type: 'string', required: true },
    { key: 'description', type: 'string', required: false },
    { key: 'completed', type: 'boolean', required: true },
    { key: 'archived', type: 'boolean', required: true },
    { key: 'priority', type: 'string', required: true },
    { key: 'dueDate', type: 'datetime', required: false },
    { key: 'dueTime', type: 'string', required: false },
    { key: 'projectId', type: 'string', required: false },
    { key: 'categoryId', type: 'string', required: false },
    { key: 'tagIds', type: 'string', required: false, array: true },
    { key: 'estimatedDuration', type: 'integer', required: false },
    { key: 'completedAt', type: 'datetime', required: false },
    { key: 'notes', type: 'string', required: false }
  ], indexes: [
    { key: 'tasks_userId', attributes: ['userId'], orders: ['ASC'], type: 'key' },
    { key: 'tasks_completed', attributes: ['completed'], orders: ['ASC'], type: 'key' },
    { key: 'tasks_archived', attributes: ['archived'], orders: ['ASC'], type: 'key' },
    { key: 'tasks_dueDate', attributes: ['dueDate'], orders: ['ASC'], type: 'key' },
    { key: 'tasks_projectId', attributes: ['projectId'], orders: ['ASC'], type: 'key' }
  ] },
  { key: 'subtasks', name: 'subtasks', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'taskId', type: 'string', required: true },
    { key: 'title', type: 'string', required: true },
    { key: 'completed', type: 'boolean', required: true },
    { key: 'position', type: 'integer', required: true }
  ], indexes: [{ key: 'subtasks_user_task', attributes: ['userId','taskId'], orders: ['ASC','ASC'], type: 'key' }] },
  { key: 'tags', name: 'tags', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'name', type: 'string', required: true },
    { key: 'color', type: 'string', required: false }
  ], indexes: [{ key: 'tags_user_name', attributes: ['userId','name'], orders: ['ASC','ASC'], type: 'key' }] },
  { key: 'categories', name: 'categories', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'name', type: 'string', required: true },
    { key: 'color', type: 'string', required: false }
  ], indexes: [{ key: 'categories_user_name', attributes: ['userId','name'], orders: ['ASC','ASC'], type: 'key' }] },
  { key: 'focusSessions', name: 'focus_sessions', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'duration', type: 'integer', required: true },
    { key: 'completed', type: 'boolean', required: true },
    { key: 'startedAt', type: 'datetime', required: true },
    { key: 'endedAt', type: 'datetime', required: false }
  ], indexes: [{ key: 'focus_user_startedAt', attributes: ['userId','startedAt'], orders: ['ASC','DESC'], type: 'key' }] },
  { key: 'habits', name: 'habits', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'title', type: 'string', required: true },
    { key: 'frequency', type: 'string', required: true },
    { key: 'streak', type: 'integer', required: true },
    { key: 'completedDates', type: 'string', required: false, array: true }
  ], indexes: [{ key: 'habits_user', attributes: ['userId'], orders: ['ASC'], type: 'key' }] },
  { key: 'settings', name: 'settings', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'theme', type: 'string', required: true },
    { key: 'timezone', type: 'string', required: true },
    { key: 'preferences', type: 'string', required: false }
  ], indexes: [{ key: 'settings_user', attributes: ['userId'], orders: ['ASC'], type: 'key', unique: true }] },
  { key: 'activityLog', name: 'activity_log', attributes: [
    { key: 'userId', type: 'string', required: true },
    { key: 'action', type: 'string', required: true },
    { key: 'entity', type: 'string', required: true },
    { key: 'entityId', type: 'string', required: true },
    { key: 'timestamp', type: 'datetime', required: true }
  ], indexes: [{ key: 'activity_user_timestamp', attributes: ['userId','timestamp'], orders: ['ASC','DESC'], type: 'key' }] }
]

async function main() {
  try {
    console.log('Verifying database...')
    const db = await request(`/databases/${databaseId}`)
    console.log('Found database:', db.$id)

    console.log('Listing existing collections...')
    const existing = await request(`/databases/${databaseId}/collections`)
    const existingMap = new Map(existing.collections.map((c) => [c.name, c]))

    const resultEnv = {}

    for (const col of collections) {
      if (existingMap.has(col.name)) {
        const c = existingMap.get(col.name)
        console.log(`Collection exists: ${col.name} -> ${c.$id}`)
        resultEnv[`APPWRITE_COLLECTION_${col.key.toUpperCase()}`] = c.$id
        // TODO: validate attributes and indexes exist (skipped - best effort)
        continue
      }

      console.log(`Creating collection: ${col.name}`)
      const collectionId = makeId(col.name)
      const created = await request(`/databases/${databaseId}/collections`, {
        method: 'POST',
        body: JSON.stringify({
          collectionId,
          name: col.name,
          read: [],
          write: [],
        })
      })
      console.log(`Created collection ${col.name} id=${created.$id}`)
      resultEnv[`APPWRITE_COLLECTION_${col.key.toUpperCase()}`] = created.$id

      // Create attributes
      for (const attr of col.attributes) {
        console.log(`Creating attribute ${attr.key} (${attr.type}) on ${col.name}`)
        try {
          if (attr.type === 'string') {
            await request(`/databases/${databaseId}/collections/${created.$id}/attributes/string`, {
              method: 'POST', body: JSON.stringify({ key: attr.key, size: 191, required: Boolean(attr.required), array: Boolean(attr.array) })
            })
          } else if (attr.type === 'boolean') {
            await request(`/databases/${databaseId}/collections/${created.$id}/attributes/boolean`, { method: 'POST', body: JSON.stringify({ key: attr.key, required: Boolean(attr.required) }) })
          } else if (attr.type === 'integer') {
            await request(`/databases/${databaseId}/collections/${created.$id}/attributes/integer`, { method: 'POST', body: JSON.stringify({ key: attr.key, required: Boolean(attr.required) }) })
          } else if (attr.type === 'datetime') {
            await request(`/databases/${databaseId}/collections/${created.$id}/attributes/datetime`, { method: 'POST', body: JSON.stringify({ key: attr.key, required: Boolean(attr.required) }) })
          } else {
            console.warn('Unknown attribute type', attr.type)
          }
        } catch (err) {
          console.error('Attribute creation failed:', err.message)
        }
      }

      // Create indexes
      for (const idx of col.indexes || []) {
        console.log(`Creating index ${idx.key} on ${col.name}`)
        try {
          await request(`/databases/${databaseId}/collections/${created.$id}/indexes`, { method: 'POST', body: JSON.stringify({ key: idx.key, type: idx.type || 'key', attributes: idx.attributes, orders: idx.orders }) })
        } catch (err) {
          console.error('Index creation failed:', err.message)
        }
      }

    }

    // Append new collection IDs to .env.local
    if (Object.keys(resultEnv).length) {
      console.log('Writing collection IDs to .env.local')
      const lines = []
      for (const [k, v] of Object.entries(resultEnv)) lines.push(`${k}=${v}`)
      fs.appendFileSync(envPath, '\n' + lines.join('\n') + '\n')
      console.log('Appended collection IDs to .env.local')
    } else {
      console.log('No new collections created; nothing to write to .env.local')
    }

    // Create storage bucket for files if not exists
    console.log('Checking storage buckets...')
    const buckets = await request(`/storage/buckets`)
    const filesBucketName = 'phour_files'
    let filesBucket = buckets.buckets.find((b) => b.name === filesBucketName)
    if (filesBucket) {
      console.log('Files bucket exists:', filesBucket.$id)
      fs.appendFileSync(envPath, `\nAPPWRITE_BUCKET_FILES=${filesBucket.$id}\n`)
    } else {
      console.log('Creating files bucket...')
      const bucketId = makeId('files')
      const createdBucket = await request(`/storage/buckets`, { method: 'POST', body: JSON.stringify({ bucketId, name: filesBucketName, read: [], write: [], enabled: true }) })
      console.log('Created bucket id=', createdBucket.$id)
      fs.appendFileSync(envPath, `\nAPPWRITE_BUCKET_FILES=${createdBucket.$id}\n`)
    }

    // Test create & delete a temp document in tasks
    console.log('Verifying CRUD: creating temporary document in tasks')
    const tasksCollectionId = resultEnv.APPWRITE_COLLECTION_TASKS || (existingMap.get('tasks') && existingMap.get('tasks').$id) || process.env.APPWRITE_COLLECTION_TASKS
    if (!tasksCollectionId) {
      console.warn('No tasks collection ID available for CRUD test. Skipping test.')
    } else {
      const temp = await request(`/databases/${databaseId}/collections/${tasksCollectionId}/documents`, { method: 'POST', body: JSON.stringify({ documentId: 'unique()', data: { userId: 'provision_test_user', title: 'temp', completed: false, archived: false, priority: 'low', tagIds: [] } }) })
      console.log('Created temp document id=', temp.$id)
      await request(`/databases/${databaseId}/collections/${tasksCollectionId}/documents/${temp.$id}`, { method: 'DELETE' })
      console.log('Deleted temp document')
    }

    console.log('Provisioning complete')
  } catch (err) {
    console.error('Provisioning failed:', err.message)
    process.exit(1)
  }
}

main()
