import type { CollectionDefinition } from './schema'

export const collectionId = (definition: CollectionDefinition) => process.env[definition.envKey] || definition.name

export function collectionPermissions() {
  // All application data is accessed through authenticated server routes.
  return { read: [], write: [] }
}
