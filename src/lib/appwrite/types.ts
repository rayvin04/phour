export type AppwriteDocument = { $id: string; $createdAt: string; $updatedAt: string; userId: string }
export type DocumentList<T> = { documents: T[]; total: number }
export type PersistedTask = AppwriteDocument & { title: string; description?: string; completed: boolean; archived: boolean; priority: 'low'|'medium'|'high'; dueDate?: string; dueTime?: string; projectId?: string; categoryId?: string; tagIds: string[]; estimatedDuration?: number; completedAt?: string; notes?: string }
export type PersistedHabit = AppwriteDocument & { title: string; frequency: string; streak: number; completedDates: string[] }
export type PersistedFocusSession = AppwriteDocument & { duration: number; completed: boolean; startedAt: string; endedAt?: string }
export type PersistedFile = AppwriteDocument & {
  filename: string
  originalFilename: string
  mimeType: string
  size: number
  bucketId: string
  storageFileId: string
  uploadedAt: string
  expiresAt?: string
  isPermanent: boolean
  previewUrl?: string
}
export type PersistedNote = AppwriteDocument & { title: string; content: string; color: string; type: 'normal' | 'task' | 'habit'; dueDate?: string; x: number; y: number; width: number; height: number; zIndex: number; rotation: number }
export type PersistedNoteImage = AppwriteDocument & { storageFileId: string; filename: string; mimeType: string; bucketId: string; x: number; y: number; width: number; height: number; zIndex: number; rotation: number }
export type PersistedCanvasState = AppwriteDocument & { zoom: number; panX: number; panY: number }
export type PersistedRelationship = AppwriteDocument & { noteId: string; entityType: 'task' | 'habit'; entityId: string }
