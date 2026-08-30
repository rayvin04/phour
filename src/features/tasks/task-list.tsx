'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SectionHeading } from '@/components/ui/section-heading'
import { Skeleton } from '@/components/ui/skeleton'
import type { Task } from './types'

type TaskListProps = {
  tasks: Task[]
  completedCount: number
  isLoading: boolean
  onAdd: (title: string) => Promise<boolean>
  onToggle: (id: string) => Promise<boolean>
}

function TaskListSkeleton() {
  return (
    <div className="task-list" aria-label="Loading tasks" aria-busy="true">
      <Skeleton className="task-skeleton" />
      <Skeleton className="task-skeleton" />
      <Skeleton className="task-skeleton" />
    </div>
  )
}

export function TaskList({ tasks, completedCount, isLoading, onAdd, onToggle }: TaskListProps) {
  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting || !draft.trim()) return
    setIsSubmitting(true)
    if (await onAdd(draft)) setDraft('')
    setIsSubmitting(false)
  }

  return (
    <Card className="tasks" id="tasks">
      <SectionHeading title="Today's tasks" meta={`${completedCount} of ${tasks.length} done`} />
      <form className="task-form" onSubmit={submit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What needs doing?"
          aria-label="New task"
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting || !draft.trim()}>
          {isSubmitting ? 'Adding…' : 'Add'}
        </Button>
      </form>

      {isLoading ? (
        <TaskListSkeleton />
      ) : tasks.length > 0 ? (
        <div className="task-list">
          {tasks.map((task) => (
            <label className={`task${task.done ? ' done' : ''}`} key={task.id}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => void onToggle(task.id)}
                aria-label={`Mark "${task.title}" as ${task.done ? 'incomplete' : 'complete'}`}
              />
              <span>{task.title}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="empty-state compact">
          <h2>No tasks yet</h2>
          <p>Add your first task above to get started.</p>
        </div>
      )}
    </Card>
  )
}
