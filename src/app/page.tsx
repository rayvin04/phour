'use client'

import Image from 'next/image'
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { TaskList } from '@/features/tasks/task-list'
import { useTaskWorkspace } from '@/features/tasks/tasks-provider'
import { useHabitsWorkspace } from '@/features/habits/habits-provider'
import { useFocusTimer } from '@/features/focus/focus-timer-provider'
import { quoteForDate } from '@/lib/quotes'

function DashboardHome() {
  const { user } = useUser()
  const { activeTasks: tasks, completedCount, isLoading: tasksLoading, addTask, toggleTask } = useTaskWorkspace()
  const { habits } = useHabitsWorkspace()
  const { focusSeconds } = useFocusTimer()

  const completion = useMemo(
    () => (tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0),
    [completedCount, tasks.length],
  )
  const name = user
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
  const hour = now.getHours()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  const greeting = useMemo(() => {
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [hour])
  const quote = useMemo(() => quoteForDate(now), [day, month, now, year])
  const completedHabits = habits.filter((h) => h.completed).length

  return (
    <AppShell>
      <div className="page-intro">
        <h1>{greeting}, {name}</h1>
        <p className="dashboard-datetime">{dateTimeLabel}</p>
        <p className="dashboard-quote">"{quote}"</p>
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
            <strong>{Math.floor(focusSeconds / 60)} <em>m</em></strong>
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

function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__content">
          <span className="eyebrow eyebrow--brand">Intentional productivity</span>
          <h1>Give your focus a home.</h1>
          <p className="landing-copy">
            Phour brings your tasks, habits, file flow, and focus sessions into one calm workspace so you can do the important work without the noise.
          </p>
          <div className="landing-actions">
            <SignInButton mode="modal">
              <button type="button" className="button button-primary">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="button button-secondary">Get started</button>
            </SignUpButton>
          </div>
          <div className="landing-proof">
            <span>Focus timer</span>
            <span>Daily habits</span>
            <span>File workspace</span>
          </div>
        </div>

        <div className="landing-hero__visual" aria-label="Phour dashboard preview">
          <div className="mock-window">
            <div className="mock-window__header">
              <span />
              <span />
              <span />
            </div>
            <div className="mock-window__body">
              <div className="mock-brand-row">
                <Image src="/branding/phour-name-logo.png" alt="Phour logo" width={130} height={30} />
              </div>
              <div className="mock-stats">
                <div className="mock-stat">
                  <small>Today</small>
                  <strong>8</strong>
                </div>
                <div className="mock-stat">
                  <small>Focus</small>
                  <strong>45m</strong>
                </div>
                <div className="mock-stat">
                  <small>Habits</small>
                  <strong>4/5</strong>
                </div>
              </div>
              <div className="mock-panel">
                <div className="mock-panel__row"><span /> <span /> <span /></div>
                <div className="mock-panel__row"><span /> <span className="short" /> <span className="done" /></div>
                <div className="mock-panel__row"><span /> <span className="short" /> <span className="done" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="eyebrow">Everything in one place</p>
          <h2>Built for deliberate work.</h2>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-icon">✅</span>
            <h3>Task clarity</h3>
            <p>Organize work into clear priorities and keep momentum visible.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">⏱️</span>
            <h3>Deep focus</h3>
            <p>Protect intentional time with simple, distraction-free focus sessions.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">🔁</span>
            <h3>Habit rhythm</h3>
            <p>Track the routines that make progress sustainable over time.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">📁</span>
            <h3>File flow</h3>
            <p>Store and revisit files without leaving the flow of your workspace.</p>
          </article>
        </div>
      </section>

      <section className="landing-section landing-section--soft">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Why teams choose Phour</p>
            <h2>Less chaos. More intentional progress.</h2>
          </div>
        </div>

        <div className="benefits-grid">
          <div className="benefit-item">
            <strong>Calm structure</strong>
            <p>Simple views keep your planning focused and your attention in the right place.</p>
          </div>
          <div className="benefit-item">
            <strong>Momentum tracking</strong>
            <p>See progress at a glance across tasks, habits, and focus sessions.</p>
          </div>
          <div className="benefit-item">
            <strong>Built for your day</strong>
            <p>Designed to support real work without clutter, friction, or overwhelm.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to build a better workday?</h2>
        <p>Launch into your workspace and turn intention into action.</p>
        <div className="landing-actions">
          <SignInButton mode="modal">
            <button type="button" className="button button-primary">Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className="button button-secondary">Get started</button>
          </SignUpButton>
        </div>
      </section>
    </main>
  )
}

export default function Home() {
  const { isLoaded, user } = useUser()

  if (!isLoaded) {
    return <main className="landing-page"><div className="landing-loading" aria-live="polite" aria-busy="true" /></main>
  }

  return user ? <DashboardHome /> : <LandingPage />
}
