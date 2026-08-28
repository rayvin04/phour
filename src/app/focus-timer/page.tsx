'use client'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useWorkspace } from '@/lib/workspace-provider'
export default function FocusTimerPage() { const { focusSeconds, sessionCount, timerRunning, startTimer, pauseTimer, resetTimer } = useWorkspace(); const remaining = Math.max(0, 25 * 60 - focusSeconds); const format = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`; return <AppShell><div className="page-intro"><p className="eyebrow">Workspace · Focus</p><h1>Focus timer</h1><p className="lede">A gentle 25-minute Pomodoro session.</p></div><Card className="timer-card"><strong className="timer-display">{format(remaining)}</strong><p>{format(focusSeconds)} elapsed · {sessionCount} session{sessionCount === 1 ? '' : 's'}</p><div className="timer-actions">{timerRunning ? <Button onClick={pauseTimer}>Pause</Button> : <Button onClick={startTimer}>{focusSeconds ? 'Resume' : 'Start session'}</Button>}<Button variant="quiet" onClick={resetTimer}>Reset</Button></div></Card></AppShell> }
