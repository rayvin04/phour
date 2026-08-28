import 'server-only'
import { UserRepository } from './base.repository'
import type { PersistedHabit } from '../types'
export const habitsRepository = new UserRepository<PersistedHabit>('habits')
