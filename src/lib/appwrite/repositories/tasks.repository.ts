import 'server-only'
import { UserRepository } from './base.repository'
import type { PersistedTask } from '../types'
export const tasksRepository = new UserRepository<PersistedTask>('tasks')
