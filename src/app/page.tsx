'use client'

import Image from 'next/image'
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import React, { memo, useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { TaskList } from '@/features/tasks/task-list'
import { useTaskWorkspace } from '@/features/tasks/tasks-provider'
import { useHabitsWorkspace } from '@/features/habits/habits-provider'
import { useFocusTimer } from '@/features/focus/focus-timer-provider'
import { quoteForDate } from '@/lib/quotes'
import {
  CheckSquareIcon,
  FolderIcon,
  RepeatIcon,
  TimerIcon,
} from '@/components/ui/icons'

// Isolated Focus Card to prevent 1-second interval timer updates from re-rendering the whole dashboard
const DashboardFocusCard = memo(function DashboardFocusCard() {
  const { focusSeconds } = useFocusTimer()
  return (
    <Link href="/focus-timer" prefetch={true} title="View focus timer">
      <Card className="metric-card">
        <div className="metric-card__header">
          <span className="metric-card__label">Focus time</span>
          <TimerIcon size={16} className="metric-card__icon" />
        </div>
        <strong className="metric-card__value">
          {Math.floor(focusSeconds / 60)} <em>m</em>
        </strong>
        <span className="metric-card__meta">
          {focusSeconds ? 'Session in progress' : 'Open focus timer'}
        </span>
      </Card>
    </Link>
  )
})

function DashboardHome() {
  const { user } = useUser()
  const {
    activeTasks: tasks,
    completedCount,
    isLoading: tasksLoading,
    addTask,
    toggleTask,
  } = useTaskWorkspace()
  const { habits } = useHabitsWorkspace()

  const completion = useMemo(
    () => (tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0),
    [completedCount, tasks.length],
  )
  const name = user
    ? (user.firstName || user.fullName || user.primaryEmailAddress?.emailAddress || 'there')
    : 'there'

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let intervalId: number | null = null
    const tick = () => setNow(new Date())
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000
    const timeoutId = window.setTimeout(() => {
      tick()
      intervalId = window.setInterval(tick, 60_000)
    }, msUntilNextMinute)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId !== null) window.clearInterval(intervalId)
    }
  }, [])

  const dateTimeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(now),
    [now],
  )
  const hour = now.getHours()

  const greeting = useMemo(() => {
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [hour])
  const quote = useMemo(() => quoteForDate(now), [now])
  const completedHabits = habits.filter((h) => h.completed).length

  return (
    <AppShell>
      <header className="page-intro">
        <h1>{greeting}, {name}</h1>
        <p className="dashboard-datetime">{dateTimeLabel}</p>
        <blockquote className="dashboard-quote">&ldquo;{quote}&rdquo;</blockquote>
      </header>

      <div className="metrics">
        <Link href="/tasks" prefetch={true} title="View tasks workspace">
          <Card className="metric-card">
            <div className="metric-card__header">
              <span className="metric-card__label">Today&apos;s tasks</span>
              <CheckSquareIcon size={16} className="metric-card__icon" />
            </div>
            <strong className="metric-card__value">
              {completedCount} <em>/ {tasksLoading ? '–' : tasks.length}</em>
            </strong>
            <span className="metric-card__meta">
              {tasksLoading ? 'Loading…' : `${completion}% complete · View all`}
            </span>
          </Card>
        </Link>
        <DashboardFocusCard />
        <Link href="/habits" prefetch={true} title="View habits workspace">
          <Card className="metric-card">
            <div className="metric-card__header">
              <span className="metric-card__label">Habits today</span>
              <RepeatIcon size={16} className="metric-card__icon" />
            </div>
            <strong className="metric-card__value">
              {completedHabits} <em>/ {habits.length}</em>
            </strong>
            <span className="metric-card__meta">
              {completedHabits === habits.length && habits.length > 0
                ? 'All habits completed today'
                : `${habits.length - completedHabits} remaining · View today`}
            </span>
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
          <h1>Give your focus a home.</h1>
          <p className="landing-copy">
            Phour brings together your tasks, habits, focus time, and file scratchpad into one calm workspace—free from the noise and bloat of heavy project tools.
          </p>
          <div className="landing-actions">
            <SignInButton mode="modal">
              <button type="button" className="button button-primary" title="Sign in to your account">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="button button-secondary" title="Get started with Phour">
                Get started
              </button>
            </SignUpButton>
          </div>
          <div className="landing-proof">
            <span>Focus sessions</span>
            <span>Daily habits</span>
            <span>File workspace</span>
            <span>Zero distraction</span>
          </div>
        </div>

        <div className="landing-hero__visual" aria-label="Phour interface preview">
          <div className="preview-surface">
            <div className="preview-surface__header">
              <div className="preview-surface__brand">
                <Image src="/branding/phour-name-logo.png" alt="Phour logo" width={112} height={26} priority />
              </div>
              <div className="preview-surface__status">
                <span className="preview-badge">Focus session active</span>
              </div>
            </div>

            <div className="preview-surface__body">
              <div className="preview-metrics">
                <div className="preview-metric">
                  <span className="preview-metric__label">Today&apos;s tasks</span>
                  <strong className="preview-metric__val">6 / 8</strong>
                </div>
                <div className="preview-metric preview-metric--accent">
                  <span className="preview-metric__label">Focus time</span>
                  <strong className="preview-metric__val">45m</strong>
                </div>
                <div className="preview-metric">
                  <span className="preview-metric__label">Habit streak</span>
                  <strong className="preview-metric__val">12d</strong>
                </div>
              </div>

              <div className="preview-tasks">
                <div className="preview-task preview-task--done">
                  <div className="preview-task__check">✓</div>
                  <span className="preview-task__title">Refine interaction design tokens</span>
                  <span className="preview-task__priority priority-tag priority-tag--low">Low</span>
                </div>
                <div className="preview-task preview-task--done">
                  <div className="preview-task__check">✓</div>
                  <span className="preview-task__title">Draft intentional product brief</span>
                  <span className="preview-task__priority priority-tag priority-tag--med">Med</span>
                </div>
                <div className="preview-task">
                  <div className="preview-task__check" />
                  <span className="preview-task__title">Run 45-minute deep focus block</span>
                  <span className="preview-task__priority priority-tag priority-tag--high">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <header className="section-heading">
          <h2>Everything in one calm place.</h2>
          <p className="section-subheading">A unified rhythm designed for clarity, momentum, and deep work.</p>
        </header>

        <div className="pillars-grid">
          <article className="pillar-item">
            <div className="pillar-icon">
              <CheckSquareIcon size={20} />
            </div>
            <h3>Task clarity</h3>
            <p>Capture what matters, organize priorities, and track progress without clutter or complexity.</p>
          </article>
          <article className="pillar-item">
            <div className="pillar-icon">
              <TimerIcon size={20} />
            </div>
            <h3>Deep focus</h3>
            <p>Carve out intentional focus sessions with built-in timing, session persistence, and zero interruptions.</p>
          </article>
          <article className="pillar-item">
            <div className="pillar-icon">
              <RepeatIcon size={20} />
            </div>
            <h3>Habit rhythm</h3>
            <p>Build daily consistency with friction-free habit logging and sustainable streak tracking.</p>
          </article>
          <article className="pillar-item">
            <div className="pillar-icon">
              <FolderIcon size={20} />
            </div>
            <h3>File scratchpad</h3>
            <p>Upload, preview, and manage working files with automatic expiration controls or permanent retention.</p>
          </article>
        </div>
      </section>

      <section className="landing-section landing-section--soft">
        <header className="section-heading">
          <h2>Built for intentional momentum.</h2>
          <p className="section-subheading">How Phour keeps your daily attention where it belongs.</p>
        </header>

        <div className="principles-grid">
          <div className="principle-card">
            <strong>Calm structure</strong>
            <p>Minimalist views and generous whitespace keep your mind focused on the current task rather than the tool.</p>
          </div>
          <div className="principle-card">
            <strong>Unified loop</strong>
            <p>Tasks, habits, focus intervals, and files work together in harmony, eliminating the need to jump between multiple disjointed apps.</p>
          </div>
          <div className="principle-card">
            <strong>Fast & keyboard friendly</strong>
            <p>Every key interaction is fast, accessible, and designed to disappear effortlessly into your daily workflow.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to build a calmer workday?</h2>
        <p>Step into an intentional productivity space and reclaim your focus.</p>
        <div className="landing-actions">
          <SignInButton mode="modal">
            <button type="button" className="button button-primary" title="Sign in to your account">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className="button button-secondary" title="Get started with Phour">
              Get started
            </button>
          </SignUpButton>
        </div>
      </section>
    </main>
  )
}

export default function Home() {
  const { isLoaded, user } = useUser()

  if (!isLoaded) {
    return (
      <main className="landing-page">
        <div className="landing-hero" style={{ padding: '80px 20px', display: 'flex', justifyContent: 'center' }}>
          <div className="skeleton" style={{ width: 300, height: 40 }} />
        </div>
      </main>
    )
  }

  return user ? <DashboardHome /> : <LandingPage />
}
