'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { requestJson, errorMessage } from '@/lib/api-client'
import { useToast } from '@/components/ui/toast'

export type NoteType = 'normal' | 'task' | 'habit'
export type CanvasNote = { id: string; title: string; content: string; color: string; type: NoteType; dueDate?: string; x: number; y: number; width: number; height: number; zIndex: number; rotation: number; createdAt: string; updatedAt: string }
export type CanvasState = { zoom: number; panX: number; panY: number }
export type CanvasAsset = { id: string; filename: string; mimeType: string; x: number; y: number; width: number; height: number; zIndex: number; rotation: number }
type NotesPayload = { notes: Array<Record<string, unknown>>; images: Array<Record<string, unknown>>; canvas: Record<string, unknown> | null }
type NotesContextValue = { notes: CanvasNote[]; assets: CanvasAsset[]; canvas: CanvasState; isLoading: boolean; addNote: (position?: { x: number; y: number }, source?: CanvasNote, type?: NoteType) => Promise<CanvasNote | null>; addAsset: (file: File, position?: { x: number; y: number }) => Promise<CanvasAsset | null>; updateNote: (id: string, patch: Partial<CanvasNote>) => void; updateAsset: (id: string, patch: Partial<CanvasAsset>) => void; deleteNote: (id: string) => Promise<void>; deleteAsset: (id: string) => Promise<void>; duplicateNote: (note: CanvasNote) => Promise<CanvasNote | null>; saveCanvas: (state: CanvasState) => void; convertNote: (note: CanvasNote, type: NoteType) => Promise<void> }

const NotesContext = createContext<NotesContextValue | null>(null)
const colors = ['#a9d6ff', '#bde8c8', '#ffe49a', '#ffc1c1', '#d7c4ff']
const temporaryId = () => `temporary-${crypto.randomUUID()}`
const mapNote = (note: Record<string, unknown>): CanvasNote => ({
  id: String(note.$id), title: String(note.title || 'Untitled note'), content: String(note.content || ''), color: String(note.color || colors[0]),
  type: note.type === 'task' || note.type === 'habit' ? note.type : 'normal', dueDate: typeof note.dueDate === 'string' ? note.dueDate : undefined,
  x: Number(note.x || 120), y: Number(note.y || 120), width: Number(note.width || 260), height: Number(note.height || 190),
  zIndex: Number(note.zIndex || 0), rotation: Number(note.rotation || 0),
  createdAt: String(note.$createdAt || new Date().toISOString()), updatedAt: String(note.$updatedAt || new Date().toISOString()),
})
const mapAsset = (asset: Record<string, unknown>): CanvasAsset => ({ id: String(asset.$id), filename: String(asset.filename || 'Canvas asset'), mimeType: String(asset.mimeType || 'application/octet-stream'), x: Number(asset.x || 160), y: Number(asset.y || 160), width: Number(asset.width || 320), height: Number(asset.height || 220), zIndex: Number(asset.zIndex || 0), rotation: Number(asset.rotation || 0) })

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { notify } = useToast()
  const [notes, setNotes] = useState<CanvasNote[]>([])
  const [assets, setAssets] = useState<CanvasAsset[]>([])
  const [canvas, setCanvas] = useState<CanvasState>({ zoom: 1, panX: 0, panY: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const notesRef = useRef(notes)
  useEffect(() => { notesRef.current = notes }, [notes])

  useEffect(() => {
    let active = true
    requestJson<NotesPayload>('/api/notes').then((payload) => {
      if (!active) return
      setNotes(payload.notes.map(mapNote))
      setAssets((payload.images || []).map(mapAsset))
      if (payload.canvas) setCanvas({ zoom: Number(payload.canvas.zoom || 1), panX: Number(payload.canvas.panX || 0), panY: Number(payload.canvas.panY || 0) })
    }).catch((error) => notify(errorMessage(error, 'Unable to load notes.'), 'error')).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [notify])

  const createRelationship = useCallback(async (note: CanvasNote, type: Exclude<NoteType, 'normal'>) => {
    const endpoint = type === 'task' ? '/api/tasks' : '/api/habits'
    const created = await requestJson<Record<string, unknown>>(endpoint, { method: 'POST', body: JSON.stringify({ title: note.title }) })
    if (typeof created.$id === 'string') await requestJson('/api/notes/relationships', { method: 'POST', body: JSON.stringify({ noteId: note.id, entityType: type, entityId: created.$id }) })
  }, [])

  const addNote = useCallback(async (position = { x: 120, y: 120 }, source?: CanvasNote, requestedType: NoteType = source?.type || 'normal') => {
    const now = new Date().toISOString()
    const optimistic: CanvasNote = { id: temporaryId(), title: source ? `${source.title} copy` : requestedType === 'normal' ? 'Untitled note' : `${requestedType[0].toUpperCase()}${requestedType.slice(1)} note`, content: source?.content || 'Start writing…', color: source?.color || colors[0], type: requestedType, dueDate: source?.dueDate, ...position, width: source?.width || 260, height: source?.height || 190, zIndex: source?.zIndex || 0, rotation: source?.rotation || 0, createdAt: now, updatedAt: now }
    setNotes((current) => [...current, optimistic])
    try {
      const saved = await requestJson<Record<string, unknown>>('/api/notes', { method: 'POST', body: JSON.stringify({ ...optimistic, type: requestedType }) })
      const note = mapNote(saved)
      setNotes((current) => current.map((item) => item.id === optimistic.id ? note : item))
      if (requestedType !== 'normal') {
        await createRelationship(note, requestedType)
      }
      return note
    } catch (error) { setNotes((current) => current.filter((item) => item.id !== optimistic.id)); notify(errorMessage(error, 'Unable to create note.'), 'error'); return null }
  }, [createRelationship, notify])

  const duplicateNote = useCallback((note: CanvasNote) => addNote({ x: note.x + 24, y: note.y + 24 }, note), [addNote])

  const addAsset = useCallback(async (file: File, position = { x: 160, y: 160 }) => {
    const form = new FormData()
    form.append('file', file); form.append('x', String(position.x)); form.append('y', String(position.y))
    try {
      const response = await fetch('/api/notes/images', { method: 'POST', body: form })
      const saved = await response.json()
      if (!response.ok) throw new Error(saved.error || 'Unable to upload canvas asset.')
      const asset = mapAsset(saved)
      setAssets((current) => [...current, asset])
      return asset
    } catch (error) { notify(errorMessage(error, 'Unable to upload canvas asset.'), 'error'); return null }
  }, [notify])

  const updateAsset = useCallback((id: string, patch: Partial<CanvasAsset>) => {
    setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, ...patch } : asset))
    if (!id.startsWith('temporary-')) void requestJson(`/api/notes/images/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).catch((error) => notify(errorMessage(error, 'Unable to save canvas asset.'), 'error'))
  }, [notify])

  const deleteAsset = useCallback(async (id: string) => {
    setAssets((current) => current.filter((asset) => asset.id !== id))
    if (!id.startsWith('temporary-')) await requestJson(`/api/notes/images/${id}`, { method: 'DELETE' }).catch((error) => notify(errorMessage(error, 'Unable to delete canvas asset.'), 'error'))
  }, [notify])

  const updateNote = useCallback((id: string, patch: Partial<CanvasNote>) => {
    setNotes((current) => current.map((note) => note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note))
    if (id.startsWith('temporary-')) return
    void requestJson(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).catch((error) => notify(errorMessage(error, 'Unable to save note.'), 'error'))
  }, [notify])

  const deleteNote = useCallback(async (id: string) => {
    const previous = notesRef.current
    setNotes((current) => current.filter((note) => note.id !== id))
    if (id.startsWith('temporary-')) return
    try { await requestJson(`/api/notes/${id}`, { method: 'DELETE' }) } catch (error) { setNotes(previous); notify(errorMessage(error, 'Unable to delete note.'), 'error') }
  }, [notify])

  const canvasSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveCanvas = useCallback((next: CanvasState) => {
    setCanvas(next)
    if (canvasSaveTimer.current) clearTimeout(canvasSaveTimer.current)
    canvasSaveTimer.current = setTimeout(() => { void requestJson('/api/notes/canvas', { method: 'PUT', body: JSON.stringify(next) }).catch(() => undefined) }, 180)
  }, [])

  const convertNote = useCallback(async (note: CanvasNote, type: NoteType) => {
    if (type === 'normal') { updateNote(note.id, { type }); return }
    try {
      await createRelationship(note, type)
      updateNote(note.id, { type })
      notify(`${type === 'task' ? 'Task' : 'Habit'} created from note`)
    } catch (error) { notify(errorMessage(error, `Unable to create ${type}.`), 'error') }
  }, [createRelationship, notify, updateNote])

  const value = useMemo(() => ({ notes, assets, canvas, isLoading, addNote, addAsset, duplicateNote, updateNote, updateAsset, deleteNote, deleteAsset, saveCanvas, convertNote }), [addAsset, addNote, assets, canvas, convertNote, deleteAsset, deleteNote, duplicateNote, isLoading, notes, saveCanvas, updateAsset, updateNote])
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (!context) throw new Error('useNotes must be used inside NotesProvider')
  return context
}
