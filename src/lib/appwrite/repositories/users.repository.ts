import 'server-only'
import { UserRepository } from './base.repository'
import type { AppwriteDocument } from '../types'
export type UserProfile = AppwriteDocument & { displayName?: string; email?: string }
export const usersRepository = new UserRepository<UserProfile>('users')
