import 'server-only'
import { UserRepository } from './base.repository'
import type { AppwriteDocument } from '../types'
export type Tag = AppwriteDocument & { name: string; color?: string }
export type Category = AppwriteDocument & { name: string; color?: string }
export const tagsRepository = new UserRepository<Tag>('tags')
export const categoriesRepository = new UserRepository<Category>('categories')
