'use client'

import React, { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FlameIcon, PlusIcon } from '@/components/ui/icons'
import { useHabitsWorkspace } from '@/features/habits/habits-provider'

export default function HabitsPage() {
  const { habits, isLoading, addHabit, toggleHabit } = useHabitsWorkspace()
  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const completedToday = habits.filter((h) => h.completed).length

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting || !draft.trim()) return
    setIsSubmitting(true)
    if (await addHabit(draft)) setDraft('')
    setIsSubmitting(false)
  }

  return (
    <>
      <header className="page-intro">
        <h1>Habits</h1>
        <p className="lede">Small promises, kept consistently.</p>
      </header>

      <Card className="tasks-card">
        <form className="task-form" onSubmit={submit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a daily habit… (Press Enter to save)"
            aria-label="New habit"
            disabled={isSubmitting}
            className="task-input"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !draft.trim()}
            title="Create a daily habit"
            variant="primary"
          >
            <PlusIcon size={15} />
            <span>{isSubmitting ? 'Creating…' : 'Add habit'}</span>
          </Button>
        </form>

        {isLoading ? (
          <div className="task-list" aria-label="Loading habits" aria-busy="true">
            <Skeleton className="task-skeleton" />
            <Skeleton className="task-skeleton" />
            <Skeleton className="task-skeleton" />
          </div>
        ) : habits.length > 0 ? (
          <>
            <div className="habits-summary-row">
              <span className="habits-summary-text">
                {completedToday === habits.length
                  ? 'All habits completed today'
                  : `${completedToday} of ${habits.length} completed today`}
              </span>
              <div className="habits-progress-track">
                <div
                  className="habits-progress-fill"
                  style={{
                    width: `${habits.length ? Math.round((completedToday / habits.length) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="task-list">
              {habits.map((habit) => (
                <label className={`task habit-row${habit.completed ? ' done' : ''}`} key={habit.id}>
                  <input
                    type="checkbox"
                    checked={habit.completed}
                    onChange={() => void toggleHabit(habit.id)}
                    aria-label={`Mark "${habit.title}" as ${habit.completed ? 'incomplete' : 'complete'}`}
                  />
                  <span className="habit-title">{habit.title}</span>
                  {habit.streak > 0 && (
                    <span className="streak-badge" aria-label={`${habit.streak} day streak`}>
                      <FlameIcon size={13} className="streak-icon" />
                      <span>{habit.streak}d streak</span>
                    </span>
                  )}
                </label>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>No habits yet</h2>
            <p>Track a daily habit by adding one in the field above.</p>
          </div>
        )}
      </Card>
    </>
  )
}
