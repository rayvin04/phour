import 'server-only'
import { UserRepository } from './base.repository'
import type { PersistedCanvasState, PersistedNote, PersistedNoteImage, PersistedRelationship } from '../types'

export const notesRepository = new UserRepository<PersistedNote>('notes')
export const noteImagesRepository = new UserRepository<PersistedNoteImage>('noteImages')
export const canvasStateRepository = new UserRepository<PersistedCanvasState>('canvasState')
export const relationshipsRepository = new UserRepository<PersistedRelationship>('relationships')[]