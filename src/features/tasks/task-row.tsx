'use client'

import React, { memo, useState, type FormEvent } from 'react'
import type { Task } from './types'
import { ArchiveIcon, TrashIcon } from '@/components/ui/icons'

type TaskRowProps = {
  task: Task
  onToggle: (id: string) => Promise<boolean>
  onUpdate: (id: string, updates: Partial<Task>, silent?: boolean) => Promise<boolean>
  onArchive: (id: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

const PRIORITY_LABEL: Record<Task['priority'], string> = { low: 'Low', medium: 'Med', high: 'High' }

export const TaskRow = memo(function TaskRow({ task, onToggle, onUpdate, onArchive, onDelete }: TaskRowProps) {
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
        <label className="task-checkbox-label">
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => void onToggle(task.id)}
            aria-label={`Mark "${task.title}" as ${task.done ? 'incomplete' : 'complete'}`}
            title={task.done ? 'Mark task incomplete' : 'Mark task complete'}
          />
          <span className="task-checkbox-custom" aria-hidden="true" />
        </label>

        <input
          className="task-edit"
          defaultValue={task.title}
          onBlur={(event) => {
            const title = event.currentTarget.value.trim()
            event.currentTarget.value = title
            void saveField(event.currentTarget, { title }, title === task.title, task.title)
          }}
          aria-label="Task title"
          title="Click to edit task title"
        />

        <div className={`priority-wrapper priority-${task.priority}`}>
          <label className="sr-only" htmlFor={`priority-${task.id}`}>Priority</label>
          <select
            id={`priority-${task.id}`}
            defaultValue={task.priority}
            onChange={(event) => void updatePriority(event.currentTarget)}
            aria-label={`Priority: ${task.priority}`}
            title={`Task priority: ${task.priority}`}
          >
            {(['low', 'medium', 'high'] as const).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </select>
        </div>

        <div className="task-actions">
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => void onArchive(task.id)}
            title="Archive this task"
            aria-label={`Archive "${task.title}"`}
          >
            <ArchiveIcon size={14} />
          </button>
          <button
            type="button"
            className="icon-action-btn icon-action-btn--danger"
            onClick={() => void onDelete(task.id)}
            aria-label={`Delete "${task.title}"`}
            title="Delete this task"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      <details className="task-details">
        <summary title="Expand task details">
          <span>Details</span>
          {task.subtasks.length > 0 && (
            <span className="task-details-badge">
              {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
            </span>
          )}
        </summary>
        <div className="details-grid">
          <label>
            <span>Due date</span>
            <input
              type="date"
              defaultValue={task.dueDate || ''}
              onBlur={(event) =>
                void saveField(event.currentTarget, { dueDate: event.currentTarget.value }, event.currentTarget.value === (task.dueDate || ''), task.dueDate || '')
              }
            />
          </label>
          <label>
            <span>Category</span>
            <input
              defaultValue={task.category || ''}
              placeholder="e.g. Focus, Work"
              onBlur={(event) =>
                void saveField(event.currentTarget, { category: event.currentTarget.value }, event.currentTarget.value === (task.category || ''), task.category || '')
              }
            />
          </label>
          <label>
            <span>Tags</span>
            <input
              defaultValue={task.tags.join(', ')}
              placeholder="comma, separated"
              onBlur={(event) => {
                const tags = event.currentTarget.value.split(',').map((t) => t.trim()).filter(Boolean)
                void saveField(event.currentTarget, { tags }, tags.join(',') === task.tags.join(','), task.tags.join(', '))
              }}
            />
          </label>
          <label>
            <span>Notes</span>
            <textarea
              defaultValue={task.notes || ''}
              placeholder="Add personal notes or context…"
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
                    title={subtask.done ? 'Mark subtask incomplete' : 'Mark subtask complete'}
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
            <button type="submit" className="text-button" disabled={!subtaskDraft.trim()} title="Add subtask">
              Add
            </button>
          </form>
        </div>
      </details>
    </article>
  )
})
