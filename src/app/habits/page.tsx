'use client'

import { useState, type FormEvent } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
    <AppShell>
      <div className="page-intro">
        <p className="eyebrow">Workspace · Habits</p>
        <h1>Habits</h1>
        <p className="lede">Small promises, kept consistently.</p>
      </div>

      <Card className="tasks">
        <form className="task-form" onSubmit={submit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a habit…"
            aria-label="New habit"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={isSubmitting || !draft.trim()}>
            {isSubmitting ? 'Creating…' : 'Create habit'}
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
            {habits.length > 1 && (
              <p className="habits-summary">
                {completedToday === habits.length
                  ? 'All habits complete today 🎉'
                  : `${completedToday} of ${habits.length} complete today`}
              </p>
            )}
            <div className="task-list">
              {habits.map((habit) => (
                <label className={`task${habit.completed ? ' done' : ''}`} key={habit.id}>
                  <input
                    type="checkbox"
                    checked={habit.completed}
                    onChange={() => void toggleHabit(habit.id)}
                    aria-label={`Mark "${habit.title}" as ${habit.completed ? 'incomplete' : 'complete'}`}
                  />
                  <span>{habit.title}</span>
                  {habit.streak > 0 && (
                    <span className="streak" aria-label={`${habit.streak} day streak`}>
                      {habit.streak}d streak
                    </span>
                  )}
                </label>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>No habits yet</h2>
            <p>Track a daily habit by creating one above.</p>
          </div>
        )}
      </Card>
    </AppShell>
  )
}
