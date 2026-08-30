import 'server-only'
import { UserRepository } from './base.repository'
import type { PersistedFile } from '../types'
export const filesRepository = new UserRepository<PersistedFile>('files')
