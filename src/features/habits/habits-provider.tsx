'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { requestJson, errorMessage } from '@/lib/api-client'
import { useToast } from '@/components/ui/toast'

export type Habit = { id: string; title: string; completed: boolean; streak: number; completedDates: string[] }
type PersistedHabit = { $id: string; title: string; streak: number; completedDates: string[] }
type HabitsContextValue = {
  habits: Habit[]
  isLoading: boolean
  error: string | null
  addHabit: (title: string) => Promise<boolean>
  toggleHabit: (id: string) => Promise<boolean>
  ensureLoaded: () => Promise<void>
}

const HabitsContext = createContext<HabitsContextValue | null>(null)
type ActionResult = { ok: true } | { ok: false; error: string }
type FailureResult = Extract<ActionResult, { ok: false }>
const success: ActionResult = { ok: true }
const temporaryId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? `temporary-${crypto.randomUUID()}` : `temporary-${Date.now()}-${Math.random()}`
const localDate = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const toHabit = (habit: PersistedHabit): Habit => ({ id: habit.$id, title: habit.title, streak: habit.streak, completedDates: habit.completedDates || [], completed: (habit.completedDates || []).includes(localDate()) })

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser()
  const { notify } = useToast()
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptedUserId, setAttemptedUserId] = useState<string | null>(null)
  const previousUserId = useRef<string | null | undefined>(user?.id)

  useEffect(() => {
    if (previousUserId.current === user?.id) return
    previousUserId.current = user?.id
    setAttemptedUserId(null)
    setHabits([])
    setError(null)
    setIsLoading(false)
  }, [user?.id])

  const fail = useCallback((cause: unknown, fallback: string): FailureResult => {
    const message = errorMessage(cause, fallback)
    setError(message)
    return { ok: false, error: message }
  }, [])

  const ensureLoaded = useCallback(async () => {
    if (!isLoaded || !user || attemptedUserId === user.id) return
    setAttemptedUserId(user.id)
    setIsLoading(true)
    setError(null)
    try {
      const items = await requestJson<PersistedHabit[]>('/api/habits')
      setHabits(items.map(toHabit))
    } catch (cause) {
      const result = fail(cause, 'Unable to load habits.')
      notify(result.error, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [attemptedUserId, fail, isLoaded, notify, user])

  const addHabit = useCallback(async (title: string) => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      const result = fail(new Error('Add a habit title before saving.'), 'Unable to create habit.')
      notify(result.error, 'error')
      return false
    }

    const optimisticHabit: Habit = { id: temporaryId(), title: trimmedTitle, streak: 0, completedDates: [], completed: false }
    setError(null)
    setHabits((current) => [...current, optimisticHabit])
    try {
      const habit = await requestJson<PersistedHabit>('/api/habits', { method: 'POST', body: JSON.stringify({ title: trimmedTitle }) })
      setHabits((current) => current.map((item) => item.id === optimisticHabit.id ? toHabit(habit) : item))
      notify('Habit created')
      return true
    } catch (cause) {
      setHabits((current) => current.filter((item) => item.id !== optimisticHabit.id))
      const result = fail(cause, 'Unable to create habit.')
      notify(result.error, 'error')
      return false
    }
  }, [fail, notify])

  const toggleHabit = useCallback(async (id: string) => {
    const previousHabit = habits.find((habit) => habit.id === id)
    if (!previousHabit) {
      const result = fail(new Error('That habit is no longer available.'), 'Unable to update habit.')
      notify(result.error, 'error')
      return false
    }

    const date = localDate()
    const completedDates = previousHabit.completed ? previousHabit.completedDates.filter((item) => item !== date) : [...previousHabit.completedDates, date]
    const optimisticHabit = { ...previousHabit, completedDates, completed: !previousHabit.completed, streak: previousHabit.completed ? Math.max(0, previousHabit.streak - 1) : previousHabit.streak + 1 }
    setError(null)
    setHabits((current) => current.map((habit) => habit.id === id ? optimisticHabit : habit))

    try {
      await requestJson(`/api/habits/${id}`, { method: 'PATCH', body: JSON.stringify({ completedDates, streak: optimisticHabit.streak }) })
      notify(optimisticHabit.completed ? 'Habit completed' : 'Habit marked incomplete')
      return true
    } catch (cause) {
      setHabits((current) => current.map((habit) => habit.id === id ? previousHabit : habit))
      const result = fail(cause, 'Unable to update habit.')
      notify(result.error, 'error')
      return false
    }
  }, [fail, habits, notify])

  const isWaitingForInitialLoad = isLoaded && Boolean(user) && attemptedUserId !== user?.id && !error
  const value = useMemo(() => ({ habits, isLoading: isLoading || isWaitingForInitialLoad, error, addHabit, toggleHabit, ensureLoaded }), [addHabit, ensureLoaded, error, habits, isLoading, isWaitingForInitialLoad, toggleHabit])
  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}

export function useHabitsWorkspace() {
  const context = useContext(HabitsContext)
  const ensureLoaded = context?.ensureLoaded
  useEffect(() => { if (ensureLoaded) void ensureLoaded() }, [ensureLoaded])
  if (!context) throw new Error('useHabitsWorkspace must be used inside HabitsProvider')
  return context
}
