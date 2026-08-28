import 'server-only'
import { appwriteRequest } from '../client'
import { appwriteConfig, type CollectionName, collectionId } from '../config'
import type { AppwriteDocument, DocumentList } from '../types'

const query = (value: string) => `equal("userId", ["${value}"])`
export class UserRepository<T extends AppwriteDocument> {
  constructor(private readonly collection: CollectionName) {}
  private path(documentId = '') { const { databaseId } = appwriteConfig(); return `/databases/${databaseId}/collections/${collectionId(this.collection)}/documents${documentId ? `/${documentId}` : ''}` }
  async list(userId: string) { const params = new URLSearchParams({ total: 'false' }); params.append('queries[]', query(userId)); const result = await appwriteRequest<DocumentList<T>>(`${this.path()}?${params}`); return result.documents.filter((document) => document.userId === userId) }
  async create(userId: string, data: Omit<T, keyof AppwriteDocument>) { return appwriteRequest<T>(this.path(), { method: 'POST', body: JSON.stringify({ documentId: 'unique()', data: { ...data, userId } }) }) }
  async update(userId: string, id: string, data: Partial<Omit<T, keyof AppwriteDocument>>) { const existing = await appwriteRequest<T>(this.path(id)); if (existing.userId !== userId) throw new Error('Forbidden'); return appwriteRequest<T>(this.path(id), { method: 'PATCH', body: JSON.stringify({ data }) }) }
  async remove(userId: string, id: string) { const existing = await appwriteRequest<T>(this.path(id)); if (existing.userId !== userId) throw new Error('Forbidden'); await appwriteRequest<void>(this.path(id), { method: 'DELETE' }) }
}
