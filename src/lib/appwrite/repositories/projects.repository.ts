import 'server-only'
import { UserRepository } from './base.repository'
import type { AppwriteDocument } from '../types'
export type PersistedProject = AppwriteDocument & { name: string; description?: string; color?: string; icon?: string; archived: boolean }
export const projectsRepository = new UserRepository<PersistedProject>('projects')
