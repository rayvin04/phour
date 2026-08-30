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
