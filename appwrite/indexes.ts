import type { CollectionDefinition } from './schema'

export type IndexDefinition = { key: string; attributes: string[]; orders?: ('ASC' | 'DESC')[]; unique?: boolean }

export function indexesFor(collection: CollectionDefinition): IndexDefinition[] {
  if (collection.key === 'notes') return [
    { key: 'notes_user_updated', attributes: ['userId', '$updatedAt'], orders: ['ASC', 'DESC'] },
    { key: 'notes_user_type', attributes: ['userId', 'type'], orders: ['ASC', 'ASC'] },
  ]
  if (collection.key === 'noteImages') return [{ key: 'note_images_user', attributes: ['userId'], orders: ['ASC'] }]
  if (collection.key === 'canvasState') return [{ key: 'canvas_state_user', attributes: ['userId'], orders: ['ASC'], unique: true }]
  return [
    { key: 'relationships_user_note', attributes: ['userId', 'noteId'], orders: ['ASC', 'ASC'] },
    { key: 'relationships_entity', attributes: ['entityType', 'entityId'], orders: ['ASC', 'ASC'] },
  ]
}
