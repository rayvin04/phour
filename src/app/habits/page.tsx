'use client'
import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useWorkspace } from '@/lib/workspace-provider'
export default function HabitsPage() { const { habits, addHabit, toggleHabit } = useWorkspace(); const [draft, setDraft] = useState(''); return <AppShell><div className="page-intro"><p className="eyebrow">Workspace · Habits</p><h1>Habits</h1><p className="lede">Small promises, kept consistently.</p></div><Card className="tasks"><form className="task-form" onSubmit={(e) => { e.preventDefault(); if (addHabit(draft)) setDraft('') }}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a habit…" aria-label="New habit"/><Button type="submit">Create habit</Button></form>{habits.length ? habits.map((habit) => <label className={habit.completed ? 'task done' : 'task'} key={habit.id}><input type="checkbox" checked={habit.completed} onChange={() => toggleHabit(habit.id)}/><span>{habit.title}</span><small className="streak">{habit.streak} day streak</small></label>) : <div className="empty-state"><h2>No habits yet.</h2><p>Create your first habit.</p></div>}</Card></AppShell> }
