import 'server-only'
import { UserRepository } from './base.repository'
import type { AppwriteDocument } from '../types'
export type PersistedSettings = AppwriteDocument & { theme: string; timezone: string; preferences: string }
export const settingsRepository = new UserRepository<PersistedSettings>('settings')
