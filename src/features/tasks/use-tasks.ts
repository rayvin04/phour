'use client'

import { useCallback, useMemo, useState } from 'react'
import { errorMessage } from '@/lib/api-client'
import { initialTasks, type Task } from './types'
import { tasksService } from './service'

export type ActionResult = { ok: true } | { ok: false; error: string }
const success: ActionResult = { ok: true }
const temporaryId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? `temporary-${crypto.randomUUID()}` : `temporary-${Date.now()}-${Math.random()}`

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fail = useCallback((cause: unknown, fallback: string): ActionResult => {
    const message = errorMessage(cause, fallback)
    setError(message)
    return { ok: false, error: message }
  }, [])

  const loadTasks = useCallback(async (): Promise<ActionResult> => {
    setIsLoading(true)
    setError(null)
    try {
      setTasks(await tasksService.list())
      return success
    } catch (cause) {
      return fail(cause, 'Unable to load tasks.')
    } finally {
      setIsLoading(false)
    }
  }, [fail])

  const addTask = useCallback(async (title: string, details: Partial<Task> = {}): Promise<ActionResult> => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return fail(new Error('Add a task title before saving.'), 'Unable to create task.')

    const optimisticTask: Task = { id: temporaryId(), title: trimmedTitle, done: false, archived: false, priority: details.priority || 'medium', dueDate: details.dueDate, tags: details.tags || [], category: details.category, notes: details.notes, subtasks: [] }
    setError(null)
    setTasks((current) => [...current, optimisticTask])

    try {
      const savedTask = await tasksService.create(trimmedTitle, details)
      setTasks((current) => current.map((task) => task.id === optimisticTask.id ? savedTask : task))
      return success
    } catch (cause) {
      setTasks((current) => current.filter((task) => task.id !== optimisticTask.id))
      return fail(cause, 'Unable to create task.')
    }
  }, [fail])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<ActionResult> => {
    const previousTask = tasks.find((task) => task.id === id)
    if (!previousTask) return fail(new Error('That task is no longer available.'), 'Unable to update task.')

    const optimisticTask = { ...previousTask, ...updates }
    setError(null)
    setTasks((current) => current.map((task) => task.id === id ? optimisticTask : task))

    const { subtasks: _subtasks, ...persistedUpdates } = updates
    if (!Object.keys(persistedUpdates).length) return success

    try {
      const savedTask = await tasksService.update(id, persistedUpdates)
      setTasks((current) => current.map((task) => task.id === id ? { ...task, ...savedTask, subtasks: optimisticTask.subtasks } : task))
      return success
    } catch (cause) {
      setTasks((current) => current.map((task) => task.id === id ? previousTask : task))
      return fail(cause, 'Unable to update task.')
    }
  }, [fail, tasks])

  const toggleTask = useCallback((id: string) => {
    const task = tasks.find((item) => item.id === id)
    return task ? updateTask(id, { done: !task.done }) : Promise.resolve(fail(new Error('That task is no longer available.'), 'Unable to update task.'))
  }, [fail, tasks, updateTask])

  const deleteTask = useCallback(async (id: string): Promise<ActionResult> => {
    const index = tasks.findIndex((task) => task.id === id)
    const previousTask = tasks[index]
    if (!previousTask) return fail(new Error('That task is no longer available.'), 'Unable to delete task.')

    setError(null)
    setTasks((current) => current.filter((task) => task.id !== id))
    try {
      await tasksService.remove(id)
      return success
    } catch (cause) {
      setTasks((current) => [...current.slice(0, index), previousTask, ...current.slice(index)])
      return fail(cause, 'Unable to delete task.')
    }
  }, [fail, tasks])

  const resetTasks = useCallback(() => {
    setTasks(initialTasks)
    setError(null)
    setIsLoading(false)
  }, [])

  const activeTasks = useMemo(() => tasks.filter((task) => !task.archived), [tasks])
  const archivedTasks = useMemo(() => tasks.filter((task) => task.archived), [tasks])
  const completedCount = useMemo(() => activeTasks.filter((task) => task.done).length, [activeTasks])

  return { tasks, activeTasks, archivedTasks, completedCount, isLoading, error, loadTasks, addTask, updateTask, toggleTask, deleteTask, resetTasks }
}
