import 'server-only'
import { UserRepository } from './base.repository'
import type { PersistedFocusSession } from '../types'
export const focusRepository = new UserRepository<PersistedFocusSession>('focusSessions')
