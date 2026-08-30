'use client'

import { useState, type FormEvent } from 'react'
import type { Task } from './types'

type TaskRowProps = {
  task: Task
  onToggle: (id: string) => Promise<boolean>
  onUpdate: (id: string, updates: Partial<Task>, silent?: boolean) => Promise<boolean>
  onArchive: (id: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

const PRIORITY_LABEL: Record<Task['priority'], string> = { low: 'Low', medium: 'Med', high: 'High' }

export function TaskRow({ task, onToggle, onUpdate, onArchive, onDelete }: TaskRowProps) {
  const [subtaskDraft, setSubtaskDraft] = useState('')

  async function saveField(
    field: HTMLInputElement | HTMLTextAreaElement,
    updates: Partial<Task>,
    unchanged: boolean,
    previousValue: string,
  ) {
    if (unchanged) return
    const saved = await onUpdate(task.id, updates, true)
    if (!saved) field.value = previousValue
  }

  async function updatePriority(field: HTMLSelectElement) {
    const saved = await onUpdate(task.id, { priority: field.value as Task['priority'] }, false)
    if (!saved) field.value = task.priority
  }

  function addSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = subtaskDraft.trim()
    if (!title) return
    void onUpdate(task.id, {
      subtasks: [...task.subtasks, { id: `local-${Date.now()}`, title, done: false }],
    }, true)
    setSubtaskDraft('')
  }

  return (
    <article className={`task-row${task.done ? ' task-row--done' : ''}`}>
      <div className="task-main">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => void onToggle(task.id)}
          aria-label={`Mark "${task.title}" as ${task.done ? 'incomplete' : 'complete'}`}
        />
        <input
          className="task-edit"
          defaultValue={task.title}
          onBlur={(event) => {
            const title = event.currentTarget.value.trim()
            event.currentTarget.value = title
            void saveField(event.currentTarget, { title }, title === task.title, task.title)
          }}
          aria-label="Task title"
        />
        <label className="sr-only" htmlFor={`priority-${task.id}`}>Priority</label>
        <div className={`priority-wrapper priority-${task.priority}`}>
          <select
            id={`priority-${task.id}`}
            defaultValue={task.priority}
            onChange={(event) => void updatePriority(event.currentTarget)}
            aria-label={`Priority: ${task.priority}`}
          >
            {(['low', 'medium', 'high'] as const).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </select>
        </div>
        <div className="task-actions">
          <button type="button" className="text-button" onClick={() => void onArchive(task.id)}>
            Archive
          </button>
          <button
            type="button"
            className="text-button text-button--danger"
            onClick={() => void onDelete(task.id)}
            aria-label={`Delete "${task.title}"`}
          >
            Delete
          </button>
        </div>
      </div>

      <details className="task-details">
        <summary>Details</summary>
        <div className="details-grid">
          <label>
            Due date
            <input
              type="date"
              defaultValue={task.dueDate || ''}
              onBlur={(event) =>
                void saveField(event.currentTarget, { dueDate: event.currentTarget.value }, event.currentTarget.value === (task.dueDate || ''), task.dueDate || '')
              }
            />
          </label>
          <label>
            Category
            <input
              defaultValue={task.category || ''}
              placeholder="e.g. Work"
              onBlur={(event) =>
                void saveField(event.currentTarget, { category: event.currentTarget.value }, event.currentTarget.value === (task.category || ''), task.category || '')
              }
            />
          </label>
          <label>
            Tags
            <input
              defaultValue={task.tags.join(', ')}
              placeholder="tag1, tag2"
              onBlur={(event) => {
                const tags = event.currentTarget.value.split(',').map((t) => t.trim()).filter(Boolean)
                void saveField(event.currentTarget, { tags }, tags.join(',') === task.tags.join(','), task.tags.join(', '))
              }}
            />
          </label>
          <label>
            Notes
            <textarea
              defaultValue={task.notes || ''}
              placeholder="Add a note…"
              onBlur={(event) =>
                void saveField(event.currentTarget, { notes: event.currentTarget.value }, event.currentTarget.value === (task.notes || ''), task.notes || '')
              }
            />
          </label>
        </div>

        <div className="subtasks">
          <p className="subtasks-heading">Subtasks</p>
          {task.subtasks.length > 0 && (
            <div className="subtask-list">
              {task.subtasks.map((subtask) => (
                <label className="subtask-item" key={subtask.id}>
                  <input
                    type="checkbox"
                    checked={subtask.done}
                    onChange={() =>
                      void onUpdate(task.id, {
                        subtasks: task.subtasks.map((item) =>
                          item.id === subtask.id ? { ...item, done: !item.done } : item,
                        ),
                      }, true)
                    }
                  />
                  <span className={subtask.done ? 'subtask-done' : ''}>{subtask.title}</span>
                </label>
              ))}
            </div>
          )}
          <form className="subtask-form" onSubmit={addSubtask}>
            <input
              className="subtask-input"
              value={subtaskDraft}
              onChange={(e) => setSubtaskDraft(e.target.value)}
              placeholder="Add a subtask…"
              aria-label="New subtask"
            />
            <button type="submit" className="text-button" disabled={!subtaskDraft.trim()}>
              Add
            </button>
          </form>
        </div>
      </details>
    </article>
  )
}
