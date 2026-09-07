'use client'

import React, { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PlusIcon } from '@/components/ui/icons'
import { TaskRow } from '@/features/tasks/task-row'
import { useTaskWorkspace } from '@/features/tasks/tasks-provider'

function TasksSkeleton() {
  return (
    <div className="task-rows-skeleton" aria-label="Loading tasks" aria-busy="true">
      <Skeleton className="task-skeleton" />
      <Skeleton className="task-skeleton" />
      <Skeleton className="task-skeleton" />
    </div>
  )
}

export default function TasksPage() {
  const {
    activeTasks,
    archivedTasks,
    isLoading,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    archiveTask,
    restoreTask,
  } = useTaskWorkspace()

  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting || !draft.trim()) return
    setIsSubmitting(true)
    if (await addTask(draft)) setDraft('')
    setIsSubmitting(false)
  }

  return (
    <>
      <header className="page-intro">
        <h1>Tasks</h1>
        <p className="lede">Capture what matters, then give it your full attention.</p>
      </header>

      <Card className="tasks-card">
        <form className="task-form" onSubmit={submit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a task… (Press Enter to save)"
            aria-label="New task"
            disabled={isSubmitting}
            className="task-input"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !draft.trim()}
            title="Create a new task"
            variant="primary"
          >
            <PlusIcon size={15} />
            <span>{isSubmitting ? 'Creating…' : 'Add task'}</span>
          </Button>
        </form>

        {isLoading ? (
          <TasksSkeleton />
        ) : activeTasks.length > 0 ? (
          <div className="task-rows">
            {activeTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onUpdate={updateTask}
                onArchive={archiveTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No active tasks</h2>
            <p>Your workspace is clear. Add a task using the input above.</p>
          </div>
        )}

        {!isLoading && archivedTasks.length > 0 && (
          <section className="archive-section" aria-label="Archived tasks">
            <div className="section-head archive-head">
              <h2>Archived</h2>
              <span>{archivedTasks.length} task{archivedTasks.length === 1 ? '' : 's'}</span>
            </div>
            <div className="archived-list">
              {archivedTasks.map((task) => (
                <div className="archived-task" key={task.id}>
                  <span className="archived-task__title">{task.title}</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => void restoreTask(task.id)}
                    title="Restore task to active list"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </Card>
    </>
  )
}
