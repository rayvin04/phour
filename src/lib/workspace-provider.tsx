'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useTasks } from '@/features/tasks/use-tasks'
type Habit = { id: string; title: string; completed: boolean; streak: number; completedDates: string[] }
type WorkspaceContextValue = ReturnType<typeof useTasks> & { habits: Habit[]; habitsError: string | null; addHabit: (title: string) => Promise<boolean>; toggleHabit: (id: string) => Promise<void>; focusSeconds: number; sessionCount: number; timerRunning: boolean; startTimer: () => void; pauseTimer: () => void; resetTimer: () => Promise<void> }
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
const today = () => new Date().toISOString().slice(0, 10)
async function api<T>(url: string, init?: RequestInit) { const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }); const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error || 'Request failed.'); return body as T }

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const taskState = useTasks()
  const [habits, setHabits] = useState<Habit[]>([]); const [habitsError, setHabitsError] = useState<string | null>(null)
  const [focusSeconds, setFocusSeconds] = useState(0); const [sessionCount, setSessionCount] = useState(0); const [timerRunning, setTimerRunning] = useState(false); const [startedAt, setStartedAt] = useState<string | null>(null)
  useEffect(() => { let active = true; api<Array<{ $id: string; title: string; streak: number; completedDates: string[] }>>('/api/habits').then((items) => { if (active) setHabits(items.map((habit) => ({ id: habit.$id, title: habit.title, streak: habit.streak, completedDates: habit.completedDates || [], completed: (habit.completedDates || []).includes(today()) }))) }).catch((error) => active && setHabitsError(error instanceof Error ? error.message : 'Unable to load habits.')); return () => { active = false } }, [])
  useEffect(() => { if (!timerRunning) return; const id = window.setInterval(() => setFocusSeconds((value) => value + 1), 1000); return () => window.clearInterval(id) }, [timerRunning])
  async function addHabit(title: string) { try { const habit = await api<{ $id: string; title: string; streak: number; completedDates: string[] }>('/api/habits', { method: 'POST', body: JSON.stringify({ title }) }); setHabits((current) => [...current, { id: habit.$id, title: habit.title, streak: habit.streak, completedDates: habit.completedDates || [], completed: false }]); return true } catch (error) { setHabitsError(error instanceof Error ? error.message : 'Unable to create habit.'); return false } }
  async function toggleHabit(id: string) { const habit = habits.find((item) => item.id === id); if (!habit) return; const dates = habit.completed ? habit.completedDates.filter((date) => date !== today()) : [...habit.completedDates, today()]; const streak = habit.completed ? Math.max(0, habit.streak - 1) : habit.streak + 1; try { await api(`/api/habits/${id}`, { method: 'PATCH', body: JSON.stringify({ completedDates: dates, streak }) }); setHabits((current) => current.map((item) => item.id === id ? { ...item, completed: !item.completed, completedDates: dates, streak } : item)) } catch (error) { setHabitsError(error instanceof Error ? error.message : 'Unable to update habit.') } }
  async function resetTimer() { const duration = focusSeconds; const began = startedAt; setTimerRunning(false); setFocusSeconds(0); setStartedAt(null); if (!duration) return; try { await api('/api/focus-sessions', { method: 'POST', body: JSON.stringify({ duration, startedAt: began || new Date(Date.now() - duration * 1000).toISOString(), endedAt: new Date().toISOString() }) }) } catch { /* Local timer remains usable when a write fails. */ } }
  const value = { ...taskState, habits, habitsError, addHabit, toggleHabit, focusSeconds, sessionCount, timerRunning, startTimer: () => { if (!timerRunning && !startedAt) { setStartedAt(new Date().toISOString()); setSessionCount((value) => value + 1) }; setTimerRunning(true) }, pauseTimer: () => setTimerRunning(false), resetTimer }
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
export function useWorkspace() { const context = useContext(WorkspaceContext); if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider'); return context }
