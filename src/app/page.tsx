'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { TaskList } from '@/features/tasks/task-list'
import { useTaskWorkspace } from '@/features/tasks/tasks-provider'
import { useHabitsWorkspace } from '@/features/habits/habits-provider'
import { useFocusTimer } from '@/features/focus/focus-timer-provider'
import { quoteForDate } from '@/lib/quotes'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

export default function Home() {
  const { isLoaded, user } = useUser()
  const { activeTasks: tasks, completedCount, isLoading: tasksLoading, addTask, toggleTask } = useTaskWorkspace()
  const { habits } = useHabitsWorkspace()
  const { focusSeconds } = useFocusTimer()

  const completion = useMemo(
    () => (tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0),
    [completedCount, tasks.length],
  )
  const name = isLoaded && user
    ? (user.firstName || user.fullName || user.primaryEmailAddress?.emailAddress || 'there')
    : 'there'

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000
    const t1 = window.setTimeout(() => {
      tick()
      const interval = window.setInterval(tick, 60_000)
      ;(window as any).__phourClockInterval = interval
    }, msUntilNextMinute)
    return () => {
      window.clearTimeout(t1)
      const interval = (window as any).__phourClockInterval
      if (interval) window.clearInterval(interval)
    }
  }, [])

  const dateTimeLabel = useMemo(
    () => new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(now),
    [now],
  )
  const greeting = useMemo(() => {
    const hour = now.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [now.getHours()])
  const quote = useMemo(() => quoteForDate(now), [now.getFullYear(), now.getMonth(), now.getDate()])
  const completedHabits = habits.filter((h) => h.completed).length

  return (
    <AppShell>
      <div className="page-intro">
        <h1>{greeting}, {name}</h1>
        <p className="dashboard-datetime">{dateTimeLabel}</p>
        <p className="dashboard-quote">“{quote}”</p>
      </div>

      <div className="metrics">
        <Link href="/tasks">
          <Card>
            <small>Today's tasks</small>
            <strong>{completedCount} <em>/ {tasksLoading ? '–' : tasks.length}</em></strong>
            <span>{tasksLoading ? 'Loading…' : `${completion}% complete · View all`}</span>
          </Card>
        </Link>
        <Link href="/focus-timer">
          <Card>
            <small>Focus time</small>
            <strong>{Math.floor(focusSeconds / 60)}<em>m</em></strong>
            <span>{focusSeconds ? 'Session in progress' : 'Open focus timer'}</span>
          </Card>
        </Link>
        <Link href="/habits">
          <Card>
            <small>Habits today</small>
            <strong>{completedHabits} <em>/ {habits.length}</em></strong>
            <span>View today's habits</span>
          </Card>
        </Link>
      </div>

      <TaskList
        tasks={tasks}
        completedCount={completedCount}
        isLoading={tasksLoading}
        onAdd={addTask}
        onToggle={toggleTask}
      />
    </AppShell>
  )
}
