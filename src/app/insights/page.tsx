'use client'

import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskWorkspace } from '@/features/tasks/tasks-provider'
import { useHabitsWorkspace } from '@/features/habits/habits-provider'
import { useFocusTimer } from '@/features/focus/focus-timer-provider'

export default function InsightsPage() {
  const { activeTasks, completedCount, isLoading: tasksLoading } = useTaskWorkspace()
  const { habits, isLoading: habitsLoading } = useHabitsWorkspace()
  const { focusSeconds, sessionCount } = useFocusTimer()

  const percent = activeTasks.length ? Math.round((completedCount / activeTasks.length) * 100) : 0
  const completedHabits = habits.filter((h) => h.completed).length
  const focusMinutes = Math.floor(focusSeconds / 60)

  return (
    <AppShell>
      <div className="page-intro">
        <p className="eyebrow">Workspace · Insights</p>
        <h1>Insights</h1>
        <p className="lede">A clear view of your momentum today.</p>
      </div>

      <div className="metrics">
        <Card>
          <small>Tasks completed</small>
          {tasksLoading ? (
            <strong>–</strong>
          ) : (
            <strong>{completedCount}</strong>
          )}
          <span>{tasksLoading ? 'Loading…' : `of ${activeTasks.length} active tasks`}</span>
        </Card>
        <Card>
          <small>Completion rate</small>
          {tasksLoading ? (
            <strong>–</strong>
          ) : (
            <strong>{percent}<em>%</em></strong>
          )}
          <span>{tasksLoading ? 'Loading…' : 'Today\'s task progress'}</span>
        </Card>
        <Card>
          <small>Focus time</small>
          <strong>{focusMinutes}<em>m</em></strong>
          <span>{sessionCount > 0 ? `${sessionCount} session${sessionCount === 1 ? '' : 's'} today` : 'No sessions started'}</span>
        </Card>
      </div>

      <Card className="tasks">
        <div className="section-head">
          <h2>Habit momentum</h2>
          <span>
            {habitsLoading ? '…' : `${completedHabits} of ${habits.length} today`}
          </span>
        </div>
        {habitsLoading ? (
          <div className="task-list" aria-label="Loading habit insights" aria-busy="true">
            <Skeleton className="task-skeleton" />
            <Skeleton className="task-skeleton" />
          </div>
        ) : habits.length > 0 ? (
          habits.map((habit) => (
            <p className="insight-row" key={habit.id}>
              <span>{habit.title}</span>
              <span className="insight-row-right">
                {habit.streak > 0 && <strong>{habit.streak}d</strong>}
                <span className={`insight-badge${habit.completed ? ' insight-badge--done' : ''}`}>
                  {habit.completed ? 'Done' : 'Pending'}
                </span>
              </span>
            </p>
          ))
        ) : (
          <div className="empty-state">
            <h2>No habits tracked yet</h2>
            <p>Create habits to see your momentum here.</p>
          </div>
        )}
      </Card>
    </AppShell>
  )
}
