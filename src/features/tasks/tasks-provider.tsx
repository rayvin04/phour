'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useToast } from '@/components/ui/toast'
import type { Task } from './types'
import { useTasks } from './use-tasks'

type TasksContextValue = Omit<ReturnType<typeof useTasks>, 'loadTasks' | 'resetTasks' | 'addTask' | 'updateTask' | 'toggleTask' | 'deleteTask'> & {
  ensureLoaded: () => Promise<void>
  addTask: (title: string, details?: Partial<Task>) => Promise<boolean>
  updateTask: (id: string, updates: Partial<Task>, silent?: boolean) => Promise<boolean>
  toggleTask: (id: string) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
  archiveTask: (id: string) => Promise<boolean>
  restoreTask: (id: string) => Promise<boolean>
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const taskState = useTasks()
  const { isLoaded, user } = useUser()
  const { notify } = useToast()
  const [attemptedUserId, setAttemptedUserId] = useState<string | null>(null)
  const previousUserId = useRef<string | null | undefined>(user?.id)

  useEffect(() => {
    if (previousUserId.current === user?.id) return
    previousUserId.current = user?.id
    setAttemptedUserId(null)
    taskState.resetTasks()
  }, [taskState.resetTasks, user?.id])

  const ensureLoaded = useCallback(async () => {
    if (!isLoaded || !user || attemptedUserId === user.id) return
    setAttemptedUserId(user.id)
    const result = await taskState.loadTasks()
    if (!result.ok) notify(result.error, 'error')
  }, [attemptedUserId, isLoaded, notify, taskState.loadTasks, user])

  const addTask = useCallback(async (title: string, details?: Partial<Task>) => {
    const result = await taskState.addTask(title, details)
    if (result.ok) notify('Task created')
    else notify(result.error, 'error')
    return result.ok
  }, [notify, taskState.addTask])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>, silent = false) => {
    const result = await taskState.updateTask(id, updates)
    if (result.ok) {
      if (!silent) notify('Task updated')
    } else {
      notify(result.error, 'error')
    }
    return result.ok
  }, [notify, taskState.updateTask])

  const toggleTask = useCallback(async (id: string) => {
    const wasCompleted = taskState.tasks.find((t) => t.id === id)?.done ?? false
    const result = await taskState.toggleTask(id)
    if (result.ok) notify(wasCompleted ? 'Task marked incomplete' : 'Task completed ✓')
    else notify(result.error, 'error')
    return result.ok
  }, [notify, taskState.tasks, taskState.toggleTask])

  const deleteTask = useCallback(async (id: string) => {
    const result = await taskState.deleteTask(id)
    if (result.ok) notify('Task deleted')
    else notify(result.error, 'error')
    return result.ok
  }, [notify, taskState.deleteTask])

  const archiveTask = useCallback(async (id: string) => {
    const result = await taskState.updateTask(id, { archived: true })
    if (result.ok) notify('Task archived')
    else notify(result.error, 'error')
    return result.ok
  }, [notify, taskState.updateTask])

  const restoreTask = useCallback(async (id: string) => {
    const result = await taskState.updateTask(id, { archived: false })
    if (result.ok) notify('Task restored')
    else notify(result.error, 'error')
    return result.ok
  }, [notify, taskState.updateTask])

  const isLoading = taskState.isLoading || (isLoaded && Boolean(user) && attemptedUserId !== user?.id && !taskState.error)
  const value = useMemo(() => ({
    ...taskState,
    isLoading,
    ensureLoaded,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    archiveTask,
    restoreTask,
  }), [addTask, archiveTask, deleteTask, ensureLoaded, isLoading, restoreTask, taskState, toggleTask, updateTask])

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTaskWorkspace() {
  const context = useContext(TasksContext)
  const ensureLoaded = context?.ensureLoaded
  useEffect(() => { if (ensureLoaded) void ensureLoaded() }, [ensureLoaded])
  if (!context) throw new Error('useTaskWorkspace must be used inside TasksProvider')
  return context
}
