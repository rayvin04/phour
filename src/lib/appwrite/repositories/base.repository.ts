import 'server-only'
import { appwriteRequest } from '../client'
import { appwriteConfig, type CollectionName, collectionId } from '../config'
import type { AppwriteDocument, DocumentList } from '../types'

export const Query = {
  equal: (attribute: string, value: string | number | boolean | string[] | number[]) =>
    JSON.stringify({ method: 'equal', attribute, values: Array.isArray(value) ? value : [value] }),
  notEqual: (attribute: string, value: string | number | boolean | string[] | number[]) =>
    JSON.stringify({ method: 'notEqual', attribute, values: Array.isArray(value) ? value : [value] }),
  lessThan: (attribute: string, value: string | number) =>
    JSON.stringify({ method: 'lessThan', attribute, values: Array.isArray(value) ? value : [value] }),
  lessThanEqual: (attribute: string, value: string | number) =>
    JSON.stringify({ method: 'lessThanEqual', attribute, values: Array.isArray(value) ? value : [value] }),
  greaterThan: (attribute: string, value: string | number) =>
    JSON.stringify({ method: 'greaterThan', attribute, values: Array.isArray(value) ? value : [value] }),
  greaterThanEqual: (attribute: string, value: string | number) =>
    JSON.stringify({ method: 'greaterThanEqual', attribute, values: Array.isArray(value) ? value : [value] }),
  search: (attribute: string, value: string) =>
    JSON.stringify({ method: 'search', attribute, values: [value] }),
  isNull: (attribute: string) =>
    JSON.stringify({ method: 'isNull', attribute }),
  isNotNull: (attribute: string) =>
    JSON.stringify({ method: 'isNotNull', attribute }),
  orderAsc: (attribute: string) =>
    JSON.stringify({ method: 'orderAsc', attribute }),
  orderDesc: (attribute: string) =>
    JSON.stringify({ method: 'orderDesc', attribute }),
  limit: (limit: number) =>
    JSON.stringify({ method: 'limit', values: [limit] }),
  offset: (offset: number) =>
    JSON.stringify({ method: 'offset', values: [offset] }),
}

export class UserRepository<T extends AppwriteDocument> {
  constructor(private readonly collection: CollectionName) {}

  private path(documentId = '') {
    const { databaseId } = appwriteConfig()
    return `/databases/${databaseId}/collections/${collectionId(this.collection)}/documents${documentId ? `/${documentId}` : ''}`
  }

  async list(userId: string, additionalQueries: string[] = []) {
    const params = new URLSearchParams({ total: 'false' })
    const queries = [Query.equal('userId', userId), ...additionalQueries]
    for (const q of queries) {
      params.append('queries[]', q)
    }
    const result = await appwriteRequest<DocumentList<T>>(`${this.path()}?${params}`)
    return result.documents.filter((document) => document.userId === userId)
  }

  async create(userId: string, data: Omit<T, keyof AppwriteDocument>) {
    return appwriteRequest<T>(this.path(), {
      method: 'POST',
      body: JSON.stringify({ documentId: 'unique()', data: { ...data, userId } }),
    })
  }

  async update(userId: string, id: string, data: Partial<Omit<T, keyof AppwriteDocument>>) {
    const existing = await appwriteRequest<T>(this.path(id))
    if (existing.userId !== userId) throw new Error('Forbidden')
    return appwriteRequest<T>(this.path(id), {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    })
  }

  async remove(userId: string, id: string) {
    const existing = await appwriteRequest<T>(this.path(id))
    if (existing.userId !== userId) throw new Error('Forbidden')
    await appwriteRequest<void>(this.path(id), { method: 'DELETE' })
  }
}
