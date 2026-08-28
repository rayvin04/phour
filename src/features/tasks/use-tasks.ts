'use client'
import { useEffect, useMemo, useState } from 'react'
import { initialTasks, type Task } from './types'
import { tasksService } from './service'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => { let active = true; tasksService.list().then((items) => { if (active) setTasks(items) }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load tasks.') }).finally(() => { if (active) setIsLoading(false) }); return () => { active = false } }, [])
  const completedCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks])
  async function addTask(title: string, details: Partial<Task> = {}) { try { const task = await tasksService.create(title, details); setTasks((current) => [...current, task]); return true } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create task.'); return false } }
  async function updateTask(id: string, updates: Partial<Task>) { try { const task = await tasksService.update(id, updates); setTasks((current) => current.map((item) => item.id === id ? { ...task, subtasks: item.subtasks } : item)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update task.') } }
  async function toggleTask(id: string) { const task = tasks.find((item) => item.id === id); if (task) await updateTask(id, { done: !task.done }) }
  async function deleteTask(id: string) { try { await tasksService.remove(id); setTasks((current) => current.filter((task) => task.id !== id)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to delete task.') } }
  const archiveTask = (id: string) => updateTask(id, { archived: true })
  const restoreTask = (id: string) => updateTask(id, { archived: false })
  return { tasks, activeTasks: tasks.filter((task) => !task.archived), archivedTasks: tasks.filter((task) => task.archived), completedCount, isLoading, error, addTask, updateTask, toggleTask, deleteTask, archiveTask, restoreTask }
}
