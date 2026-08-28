import 'server-only'
import { UserRepository } from './base.repository'
import type { AppwriteDocument } from '../types'
export type ActivityRecord = AppwriteDocument & { action: string; entity: string; entityId: string; timestamp: string }
export const activityRepository = new UserRepository<ActivityRecord>('activityLog')
