import 'server-only'
import { UserRepository } from './base.repository'
import type { AppwriteDocument } from '../types'
export type PersistedSubtask = AppwriteDocument & { taskId: string; title: string; completed: boolean; position: number }
export const subtasksRepository = new UserRepository<PersistedSubtask>('subtasks')
