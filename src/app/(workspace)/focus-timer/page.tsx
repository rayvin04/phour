'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PauseIcon, PlayIcon, RotateCcwIcon } from '@/components/ui/icons'
import { PRESET_DURATIONS, useFocusTimer } from '@/features/focus/focus-timer-provider'

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${pad(m)}:${pad(s)}`
}

export default function FocusTimerPage() {
  const {
    selectedDurationMinutes,
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
    floatingTimerHidden,
    setFloatingTimerHidden,
  } = useFocusTimer()

  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const progressPercent = totalSeconds > 0
    ? Math.min(100, Math.round((focusSeconds / totalSeconds) * 100))
    : 0

  // Update document title dynamically
  useEffect(() => {
    const prev = document.title
    if (isCompleted) {
      document.title = 'Session complete! — Phour'
    } else if (timerRunning) {
      document.title = `${formatDuration(remainingSeconds)} — Focus · Phour`
    }
    return () => {
      document.title = prev
    }
  }, [isCompleted, remainingSeconds, timerRunning])

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseInt(customInput, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
      setSelectedDurationMinutes(parsed)
      setShowCustomInput(false)
      setCustomInput('')
    }
  }

  return (
    <>
      <header className="page-intro">
        <h1>Focus timer</h1>
        <p className="lede">Protect your attention with timed, intentional sessions.</p>
      </header>

      <div className="focus-timer-container">
        {/* Preset duration selector */}
        <div className="timer-presets" role="group" aria-label="Preset durations">
          {PRESET_DURATIONS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`preset-btn${selectedDurationMinutes === preset && !showCustomInput ? ' preset-btn-active' : ''}`}
              onClick={() => {
                setShowCustomInput(false)
                setSelectedDurationMinutes(preset)
              }}
              disabled={timerRunning}
              title={`Set ${preset} minute timer`}
            >
              {preset}m
            </button>
          ))}
          <button
            type="button"
            className={`preset-btn${showCustomInput || !PRESET_DURATIONS.includes(selectedDurationMinutes as any) ? ' preset-btn-active' : ''}`}
            onClick={() => setShowCustomInput((v) => !v)}
            disabled={timerRunning}
            title="Set custom duration"
          >
            Custom…
          </button>
        </div>

        {/* Custom duration form */}
        {showCustomInput && !timerRunning && (
          <form className="timer-custom-form" onSubmit={handleCustomSubmit}>
            <input
              type="number"
              min={1}
              max={180}
              placeholder="Minutes (1–180)"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="timer-custom-input"
              autoFocus
              aria-label="Custom duration in minutes"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!customInput || parseInt(customInput, 10) <= 0}
              title="Apply custom duration"
            >
              Set duration
            </Button>
          </form>
        )}

        <Card className="timer-card">
          <strong
            className={`timer-display${isCompleted ? ' timer-display--complete' : ''}`}
            aria-label={`${formatDuration(remainingSeconds)} remaining`}
          >
            {formatDuration(remainingSeconds)}
          </strong>

          <div
            className="timer-progress-track"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Session progress"
          >
            <div
              className={`timer-progress-bar${isCompleted ? ' timer-progress-bar--complete' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="timer-meta">
            {isCompleted
              ? 'Session complete! Take a well-deserved pause.'
              : focusSeconds === 0 && !timerRunning
                ? `${selectedDurationMinutes}-minute session ready`
                : `${formatDuration(focusSeconds)} elapsed · ${sessionCount} session${sessionCount === 1 ? '' : 's'} tracked today`}
          </p>

          <div className="timer-actions">
            {timerRunning ? (
              <Button
                type="button"
                onClick={pauseTimer}
                title="Pause current session"
                size="lg"
                variant="primary"
              >
                <PauseIcon size={16} />
                <span>Pause</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={startTimer}
                disabled={isSaving}
                title="Start focus session"
                size="lg"
                variant="primary"
              >
                <PlayIcon size={15} />
                <span>
                  {isSaving ? 'Saving…' : isCompleted ? 'Start another' : focusSeconds > 0 ? 'Resume' : 'Start session'}
                </span>
              </Button>
            )}
            <Button
              type="button"
              variant="quiet"
              size="lg"
              onClick={() => void resetTimer()}
              disabled={isSaving || (focusSeconds === 0 && !isCompleted)}
              title={isCompleted ? 'Dismiss completed session' : 'Reset timer'}
            >
              <RotateCcwIcon size={15} />
              <span>{isCompleted ? 'Dismiss' : 'Reset'}</span>
            </Button>
          </div>
        </Card>
        <Button type="button" variant="quiet" onClick={() => setFloatingTimerHidden(!floatingTimerHidden)}>
          {floatingTimerHidden ? 'Show floating timer' : 'Hide floating timer'}
        </Button>
      </div>
    </>
  )
}
