import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { Client, Databases, DatabasesIndexType, ID, OrderBy } from 'node-appwrite'
import { collectionId, collectionPermissions } from '../appwrite/collections'
import { indexesFor } from '../appwrite/indexes'
import { collections } from '../appwrite/schema'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'APPWRITE_DATABASE_ID'] as const
const missing = required.filter((key) => !process.env[key])
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`)

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!.replace(/\/$/, ''))
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)
const databases = new Databases(client)
const databaseId = process.env.APPWRITE_DATABASE_ID!

function conflict(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 409
}

async function ensureAttribute(collectionIdValue: string, definition: typeof collections[number]['attributes'][number]) {
  try {
    if (definition.type === 'string') await databases.createStringAttribute(databaseId, collectionIdValue, definition.key, definition.size || 191, Boolean(definition.required), undefined, Boolean(definition.array))
    if (definition.type === 'integer') await databases.createIntegerAttribute(databaseId, collectionIdValue, definition.key, Boolean(definition.required), definition.min, definition.max, undefined, Boolean(definition.array))
    if (definition.type === 'float') await databases.createFloatAttribute(databaseId, collectionIdValue, definition.key, Boolean(definition.required), definition.min, definition.max, undefined, Boolean(definition.array))
    if (definition.type === 'boolean') await databases.createBooleanAttribute(databaseId, collectionIdValue, definition.key, Boolean(definition.required), undefined, Boolean(definition.array))
    if (definition.type === 'datetime') await databases.createDatetimeAttribute(databaseId, collectionIdValue, definition.key, Boolean(definition.required), undefined, Boolean(definition.array))
    console.log(`  created attribute ${definition.key}`)
  } catch (error) {
    if (!conflict(error)) throw error
    console.log(`  attribute exists ${definition.key}`)
  }
}

async function ensureIndex(collectionIdValue: string, index: ReturnType<typeof indexesFor>[number], attributeKeys: Map<string, string>) {
  try {
    const orders = index.orders?.map((order) => order === 'ASC' ? OrderBy.Asc : OrderBy.Desc)
    const attributes = index.attributes.map((attribute) => attributeKeys.get(attribute.toLowerCase()) || attribute)
    await databases.createIndex(databaseId, collectionIdValue, index.key, DatabasesIndexType.Key, attributes, orders)
    console.log(`  created index ${index.key}`)
  } catch (error) {
    if (!conflict(error)) throw error
    console.log(`  index exists ${index.key}`)
  }
}

async function waitForAttributes(collectionIdValue: string, requiredKeys: string[]) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await databases.listAttributes(databaseId, collectionIdValue)
    const attributesByKey = new Map(result.attributes.map((attribute) => [attribute.key.toLowerCase(), attribute]))
    const ready = requiredKeys.every((key) => attributesByKey.get(key.toLowerCase())?.status === 'available')
    if (ready) return result
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`Timed out waiting for attributes on collection ${collectionIdValue}`)
}

function persistCollectionId(envKey: string, value: string) {
  const envPath = path.resolve(process.cwd(), '.env.local')
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
  const line = `${envKey}=${value}`
  const matcher = new RegExp(`^${envKey}=.*$`, 'm')
  content = matcher.test(content) ? content.replace(matcher, line) : `${content.replace(/\s*$/, '')}\n${line}\n`
  fs.writeFileSync(envPath, content)
}

async function main() {
  const existing = await databases.listCollections(databaseId)
  const byName = new Map(existing.collections.map((item) => [item.name, item]))
  const permissions = collectionPermissions()

  for (const definition of collections) {
    const preferredId = collectionId(definition)
    const current = byName.get(definition.name)
    const id = current?.$id || preferredId || ID.unique()
    if (current) {
      console.log(`collection exists ${definition.name} (${id})`)
    } else {
      await databases.createCollection(databaseId, id, definition.name, [...permissions.read, ...permissions.write], false, true)
      console.log(`created collection ${definition.name} (${id})`)
    }
    persistCollectionId(definition.envKey, id)

    const attributes = await databases.listAttributes(databaseId, id)
    const existingAttributeKeys = new Set(attributes.attributes.map((attribute) => attribute.key.toLowerCase()))
    for (const attribute of definition.attributes) {
      if (!existingAttributeKeys.has(attribute.key.toLowerCase())) await ensureAttribute(id, attribute)
      else console.log(`  attribute exists ${attribute.key}`)
    }

    const readyAttributes = await waitForAttributes(id, definition.attributes.map((attribute) => attribute.key))
    const readyAttributeKeys = new Map(readyAttributes.attributes.map((attribute) => [attribute.key.toLowerCase(), attribute.key]))
    for (const attribute of definition.attributes) {
      if (!readyAttributeKeys.has(attribute.key.toLowerCase())) throw new Error(`Attribute ${attribute.key} was not available on ${definition.name}`)
    }

    const indexes = await databases.listIndexes(databaseId, id)
    const indexKeys = new Set(indexes.indexes.map((index) => index.key))
    const attributeKeys = new Map(readyAttributes.attributes.map((attribute) => [attribute.key.toLowerCase(), attribute.key]))
    for (const index of indexesFor(definition)) {
      if (!indexKeys.has(index.key)) await ensureIndex(id, index, attributeKeys)
      else console.log(`  index exists ${index.key}`)
    }
  }

  console.log('Appwrite schema sync complete.')
}

main().catch((error) => {
  console.error('Appwrite schema sync failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
