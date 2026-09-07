'use client'

import React, { memo } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useFocusTimer } from '@/features/focus/focus-timer-provider'
import { PauseIcon, PlayIcon, XIcon } from '@/components/ui/icons'

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${pad(m)}:${pad(s)}`
}

export const FloatingTimer = memo(function FloatingTimer() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const {
    remainingSeconds,
    focusSeconds,
    timerRunning,
    isCompleted,
    pauseTimer,
    startTimer,
    floatingTimerHidden,
    setFloatingTimerHidden,
  } = useFocusTimer()

  if (!isLoaded || !user) {
    return null
  }

  // Only show when a session is active (either actively running or paused with progress)
  const hasActiveSession = (timerRunning || (focusSeconds > 0 && remainingSeconds > 0)) && !isCompleted

  // If we are already on the full focus timer page, hide the floating widget
  if (!hasActiveSession || pathname === '/focus-timer' || floatingTimerHidden) {
    return null
  }

  function handleClick() {
    router.push('/focus-timer')
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (timerRunning) {
      pauseTimer()
    } else {
      startTimer()
    }
  }

  return (
    <aside
      className={`floating-timer${timerRunning ? ' floating-timer--running' : ''}`}
      onClick={handleClick}
      role="region"
      aria-label="Active focus timer"
      title="Click to open Focus Timer"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="floating-timer-indicator">
        <span className={`floating-timer-dot${timerRunning ? ' floating-timer-dot--pulse' : ''}`} />
      </div>

      <div className="floating-timer-info">
        <span className="floating-timer-label">Focus</span>
        <strong className="floating-timer-time">{formatDuration(remainingSeconds)}</strong>
      </div>

      <button
        type="button"
        className="floating-timer-action"
        onClick={handleToggle}
        aria-label={timerRunning ? 'Pause focus timer' : 'Resume focus timer'}
        title={timerRunning ? 'Pause focus timer' : 'Resume focus timer'}
      >
        {timerRunning ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
      </button>
      <button
        type="button"
        className="floating-timer-close"
        onClick={(event) => { event.stopPropagation(); setFloatingTimerHidden(true) }}
        aria-label="Hide floating timer"
        title="Hide floating timer"
      >
        <XIcon size={12} />
      </button>
    </aside>
  )
})
