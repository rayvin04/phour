export type AttributeDefinition = {
  key: string
  type: 'string' | 'integer' | 'float' | 'boolean' | 'datetime'
  required?: boolean
  array?: boolean
  size?: number
  min?: number
  max?: number
}

export type CollectionDefinition = {
  key: string
  name: string
  envKey: string
  attributes: AttributeDefinition[]
}

export const collections: CollectionDefinition[] = [
  {
    key: 'notes', name: 'notes', envKey: 'APPWRITE_COLLECTION_NOTES',
    attributes: [
      { key: 'userId', type: 'string', required: true, size: 191 }, { key: 'title', type: 'string', required: true, size: 120 },
      { key: 'content', type: 'string', required: true, size: 100000 }, { key: 'color', type: 'string', required: true, size: 20 },
      { key: 'type', type: 'string', required: true, size: 20 }, { key: 'dueDate', type: 'datetime' },
      { key: 'x', type: 'float', required: true }, { key: 'y', type: 'float', required: true },
      { key: 'width', type: 'float', required: true }, { key: 'height', type: 'float', required: true },
      { key: 'zIndex', type: 'integer', required: true }, { key: 'rotation', type: 'float', required: true },
    ],
  },
  {
    key: 'noteImages', name: 'note_images', envKey: 'APPWRITE_COLLECTION_NOTE_IMAGES',
    attributes: [
      { key: 'userId', type: 'string', required: true, size: 191 }, { key: 'storageFileId', type: 'string', required: true, size: 255 }, { key: 'bucketId', type: 'string', required: true, size: 255 },
      { key: 'filename', type: 'string', required: true, size: 255 }, { key: 'mimeType', type: 'string', required: true, size: 120 },
      { key: 'x', type: 'float', required: true }, { key: 'y', type: 'float', required: true },
      { key: 'width', type: 'float', required: true }, { key: 'height', type: 'float', required: true },
      { key: 'zIndex', type: 'integer', required: true }, { key: 'rotation', type: 'float', required: true },
    ],
  },
  {
    key: 'canvasState', name: 'canvas_state', envKey: 'APPWRITE_COLLECTION_CANVAS_STATE',
    attributes: [{ key: 'userId', type: 'string', required: true, size: 191 }, { key: 'zoom', type: 'float', required: true }, { key: 'panX', type: 'float', required: true }, { key: 'panY', type: 'float', required: true }, { key: 'snapToGrid', type: 'boolean', required: true }],
  },
  {
    key: 'relationships', name: 'relationships', envKey: 'APPWRITE_COLLECTION_RELATIONSHIPS',
    attributes: [{ key: 'userId', type: 'string', required: true, size: 191 }, { key: 'noteId', type: 'string', required: true, size: 255 }, { key: 'entityType', type: 'string', required: true, size: 20 }, { key: 'entityId', type: 'string', required: true, size: 255 }],
  },
]
