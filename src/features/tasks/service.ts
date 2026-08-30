'use client'

import { requestJson } from '@/lib/api-client'
import type { PersistedTask } from '@/lib/appwrite/types'
import type { Task } from './types'

const toTask = (document: PersistedTask): Task => ({
  id: document.$id,
  title: document.title,
  done: document.completed,
  archived: document.archived,
  priority: document.priority,
  dueDate: document.dueDate,
  tags: document.tagIds || [],
  category: document.categoryId,
  notes: document.notes,
  subtasks: [],
})

export const tasksService = {
  list: async () => (await requestJson<PersistedTask[]>('/api/tasks')).map(toTask),
  create: async (title: string, details: Partial<Task> = {}) => toTask(await requestJson<PersistedTask>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title,
      completed: false,
      archived: false,
      priority: details.priority || 'medium',
      dueDate: details.dueDate,
      categoryId: details.category,
      tagIds: details.tags || [],
      notes: details.notes,
    }),
  })),
  update: async (id: string, updates: Partial<Task>) => toTask(await requestJson<PersistedTask>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.done !== undefined ? { completed: updates.done, completedAt: updates.done ? new Date().toISOString() : '' } : {}),
      ...(updates.archived !== undefined ? { archived: updates.archived } : {}),
      ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
      ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate } : {}),
      ...(updates.category !== undefined ? { categoryId: updates.category } : {}),
      ...(updates.tags !== undefined ? { tagIds: updates.tags } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    }),
  })),
  remove: async (id: string) => requestJson<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
}
