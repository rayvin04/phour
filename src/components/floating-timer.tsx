'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useFocusTimer } from '@/features/focus/focus-timer-provider'

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${pad(m)}:${pad(s)}`
}

export function FloatingTimer() {
  const pathname = usePathname()
  const router = useRouter()
  const {
    remainingSeconds,
    focusSeconds,
    timerRunning,
    isCompleted,
    pauseTimer,
    startTimer,
  } = useFocusTimer()

  // Only show when a session is active (either actively running or paused with progress)
  const hasActiveSession = (timerRunning || (focusSeconds > 0 && remainingSeconds > 0)) && !isCompleted

  // If we are already on the full focus timer page, hide the floating widget
  if (!hasActiveSession || pathname === '/focus-timer') {
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
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick() }}
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
      >
        {timerRunning ? '⏸' : '▶'}
      </button>
    </aside>
  )
}
