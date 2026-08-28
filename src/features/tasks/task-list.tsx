'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SectionHeading } from '@/components/ui/section-heading'
import type { Task } from './types'

type TaskListProps = { tasks: Task[]; completedCount: number; onAdd: (title: string) => Promise<boolean>; onToggle: (id: string) => Promise<void> }
export function TaskList({ tasks, completedCount, onAdd, onToggle }: TaskListProps) {
  const [draft, setDraft] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (await onAdd(draft)) setDraft('') }
  return <Card className="tasks" id="tasks"><SectionHeading title="Today’s tasks" meta={`${completedCount} done`} /><form className="task-form" onSubmit={submit}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What needs doing?" aria-label="New task" /><Button type="submit">Add task</Button></form><div className="task-list">{tasks.map((task) => <label className={task.done ? 'task done' : 'task'} key={task.id}><input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} /><span>{task.title}</span></label>)}</div></Card>
}
