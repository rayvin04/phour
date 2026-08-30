'use client'

import { TasksProvider } from '@/features/tasks/tasks-provider'
import { HabitsProvider } from '@/features/habits/habits-provider'
import { FocusTimerProvider } from '@/features/focus/focus-timer-provider'
import { FloatingTimer } from '@/components/floating-timer'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <TasksProvider>
      <HabitsProvider>
        <FocusTimerProvider>
          {children}
          <FloatingTimer />
        </FocusTimerProvider>
      </HabitsProvider>
    </TasksProvider>
  )
}
