'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { requestJson, errorMessage } from '@/lib/api-client'
import { useToast } from '@/components/ui/toast'

const STORAGE_KEY = 'phour_focus_timer_state'
const DEFAULT_MINUTES = 25
export const PRESET_DURATIONS = [2, 5, 10, 15, 25, 30, 45, 60] as const

type StoredTimerState = {
  durationMinutes: number
  timerRunning: boolean
  startedAt: string | null
  targetEndTime: number | null
  pausedRemainingSeconds: number | null
  sessionCount: number
}

type FocusTimerContextValue = {
  selectedDurationMinutes: number
  setSelectedDurationMinutes: (minutes: number) => void
  totalSeconds: number
  focusSeconds: number
  remainingSeconds: number
  sessionCount: number
  timerRunning: boolean
  isSaving: boolean
  isCompleted: boolean
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => Promise<void>
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null)

function loadStoredState(): StoredTimerState {
  if (typeof window === 'undefined') {
    return {
      durationMinutes: DEFAULT_MINUTES,
      timerRunning: false,
      startedAt: null,
      targetEndTime: null,
      pausedRemainingSeconds: null,
      sessionCount: 0,
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredTimerState>
      return {
        durationMinutes: typeof parsed.durationMinutes === 'number' && parsed.durationMinutes > 0 ? parsed.durationMinutes : DEFAULT_MINUTES,
        timerRunning: Boolean(parsed.timerRunning && parsed.targetEndTime && parsed.targetEndTime > Date.now()),
        startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
        targetEndTime: typeof parsed.targetEndTime === 'number' ? parsed.targetEndTime : null,
        pausedRemainingSeconds: typeof parsed.pausedRemainingSeconds === 'number' ? parsed.pausedRemainingSeconds : null,
        sessionCount: typeof parsed.sessionCount === 'number' ? parsed.sessionCount : 0,
      }
    }
  } catch {
    // Ignore JSON errors
  }
  return {
    durationMinutes: DEFAULT_MINUTES,
    timerRunning: false,
    startedAt: null,
    targetEndTime: null,
    pausedRemainingSeconds: null,
    sessionCount: 0,
  }
}

export function FocusTimerProvider({ children }: { children: React.ReactNode }) {
  const { notify } = useToast()
  const initial = useMemo(loadStoredState, [])

  const [durationMinutes, setDurationMinutes] = useState(initial.durationMinutes)
  const [timerRunning, setTimerRunning] = useState(initial.timerRunning)
  const [startedAt, setStartedAt] = useState<string | null>(initial.startedAt)
  const [targetEndTime, setTargetEndTime] = useState<number | null>(initial.targetEndTime)
  const [pausedRemainingSeconds, setPausedRemainingSeconds] = useState<number | null>(initial.pausedRemainingSeconds)
  const [sessionCount, setSessionCount] = useState(initial.sessionCount)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const isCompleting = useRef(false)
  const sessionPersisted = useRef(false)

  const totalSeconds = durationMinutes * 60

  // Calculate current remaining seconds from timestamps
  const computeRemaining = useCallback((): number => {
    if (timerRunning && targetEndTime) {
      const diff = Math.round((targetEndTime - Date.now()) / 1000)
      return Math.max(0, diff)
    }
    if (pausedRemainingSeconds !== null) {
      return Math.max(0, Math.min(totalSeconds, pausedRemainingSeconds))
    }
    return totalSeconds
  }, [pausedRemainingSeconds, targetEndTime, timerRunning, totalSeconds])

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => computeRemaining())
  const focusSeconds = Math.max(0, totalSeconds - remainingSeconds)

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const state: StoredTimerState = {
      durationMinutes,
      timerRunning,
      startedAt,
      targetEndTime,
      pausedRemainingSeconds,
      sessionCount,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [durationMinutes, timerRunning, startedAt, targetEndTime, pausedRemainingSeconds, sessionCount])

  const saveSession = useCallback(async (durationSec: number, began: string | null, completed: boolean) => {
    setIsSaving(true)
    try {
      await requestJson('/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify({
          duration: durationSec,
          startedAt: began || new Date(Date.now() - durationSec * 1000).toISOString(),
          endedAt: new Date().toISOString(),
        }),
      })
      sessionPersisted.current = true
      notify(completed ? 'Focus session completed! Great work.' : 'Focus session saved')
      return true
    } catch (cause) {
      notify(errorMessage(cause, 'Unable to save your focus session.'), 'error')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [notify])

  // Timer interval tick — recomputes from timestamp every second
  useEffect(() => {
    if (!timerRunning) return

    const tick = () => {
      const remaining = computeRemaining()
      setRemainingSeconds(remaining)

      if (remaining <= 0 && !isCompleting.current) {
        isCompleting.current = true
        setTimerRunning(false)
        setTargetEndTime(null)
        setPausedRemainingSeconds(null)
        setIsCompleted(true)
        void saveSession(totalSeconds, startedAt, true)
      }
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [computeRemaining, saveSession, startedAt, timerRunning, totalSeconds])

  const setSelectedDurationMinutes = useCallback((mins: number) => {
    const safeMins = Math.max(1, Math.min(180, Math.round(mins)))
    setDurationMinutes(safeMins)
    if (!timerRunning && focusSeconds === 0) {
      setRemainingSeconds(safeMins * 60)
      setPausedRemainingSeconds(null)
    }
  }, [focusSeconds, timerRunning])

  const startTimer = useCallback(() => {
    if (timerRunning) return

    const now = Date.now()
    let currentRemaining = remainingSeconds
    if (currentRemaining <= 0 || isCompleted) {
      currentRemaining = totalSeconds
      setIsCompleted(false)
    }

    const newTargetEnd = now + currentRemaining * 1000
    const startIso = startedAt || new Date().toISOString()

    setStartedAt(startIso)
    setTargetEndTime(newTargetEnd)
    setPausedRemainingSeconds(null)
    setTimerRunning(true)
    setRemainingSeconds(currentRemaining)
    isCompleting.current = false
    sessionPersisted.current = false

    if (!startedAt) {
      setSessionCount((prev) => prev + 1)
    }
  }, [isCompleted, remainingSeconds, startedAt, timerRunning, totalSeconds])

  const pauseTimer = useCallback(() => {
    if (!timerRunning) return
    const currentRemaining = computeRemaining()
    setTimerRunning(false)
    setTargetEndTime(null)
    setPausedRemainingSeconds(currentRemaining)
    setRemainingSeconds(currentRemaining)
  }, [computeRemaining, timerRunning])

  const resetTimer = useCallback(async () => {
    const elapsed = focusSeconds
    const began = startedAt
    const shouldSave = elapsed >= 60 && !sessionPersisted.current && !isCompleted

    setTimerRunning(false)
    setTargetEndTime(null)
    setPausedRemainingSeconds(null)
    setStartedAt(null)
    setRemainingSeconds(totalSeconds)
    setIsCompleted(false)
    isCompleting.current = false

    if (shouldSave) {
      await saveSession(elapsed, began, false)
    }
  }, [focusSeconds, isCompleted, saveSession, startedAt, totalSeconds])

  const value = useMemo(() => ({
    selectedDurationMinutes: durationMinutes,
    setSelectedDurationMinutes,
    totalSeconds,
    focusSeconds,
    remainingSeconds,
    sessionCount,
    timerRunning,
    isSaving,
    isCompleted,
    startTimer,
    pauseTimer,
    resetTimer,
  }), [
    durationMinutes,
    setSelectedDurationMinutes,
    totalSeconds,
    focusSeconds,
    remainingSeconds,
    sessionCount,
    timerRunning,
    isSaving,
    isCompleted,
    startTimer,
    pauseTimer,
    resetTimer,
  ])

  return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>
}

export function useFocusTimer() {
  const context = useContext(FocusTimerContext)
  if (!context) throw new Error('useFocusTimer must be used inside FocusTimerProvider')
  return context
}
