'use client'

import { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { TaskList } from '@/features/tasks/task-list'
import { useWorkspace } from '@/lib/workspace-provider'

const navigation = ['Today', 'Tasks', 'Habits', 'Focus timer', 'Insights']

export default function Home() {
  const { isLoaded, user } = useUser()
  const { activeTasks: tasks, completedCount, addTask, toggleTask, habits, focusSeconds } = useWorkspace()
  const completion = useMemo(() => tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0, [completedCount, tasks.length])
  const name = isLoaded && user ? (user.firstName || user.fullName || user.primaryEmailAddress?.emailAddress || 'there') : 'there'

  return <main className="shell"><aside className="sidebar"><Link className="side-brand" href="/">phour<span>•</span></Link><nav aria-label="Main navigation">{navigation.map((item, index) => <Link className={index === 0 ? 'active' : ''} href={index === 0 ? '/' : `/${item.toLowerCase().replace(' ', '-')}`} key={item}>{item}</Link>)}</nav><p className="sidebar-note">Make space for what matters.</p></aside><section className="content" id="today"><div className="page-intro"><p className="eyebrow">Thursday, August 28 · A clear day ahead.</p><h1>Good morning, {name}</h1><p className="lede">A quiet place to turn intention into progress.</p></div><div className="metrics"><Link href="/tasks"><Card><small>Today’s progress</small><strong>{completedCount} <em>/ {tasks.length}</em></strong><span>{completion}% complete · View tasks</span></Card></Link><Link href="/focus-timer"><Card><small>Focus time</small><strong>{Math.floor(focusSeconds / 60)}<em>m</em></strong><span>Open focus timer</span></Card></Link><Link href="/habits"><Card><small>Habits</small><strong>{habits.filter((habit) => habit.completed).length}<em> / {habits.length}</em></strong><span>View today’s habits</span></Card></Link></div><TaskList tasks={tasks} completedCount={completedCount} onAdd={addTask} onToggle={toggleTask} /></section></main>
}
