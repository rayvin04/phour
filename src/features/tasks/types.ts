export type Task = { id: string; title: string; done: boolean; archived: boolean; priority: 'low' | 'medium' | 'high'; dueDate?: string; tags: string[]; category?: string; notes?: string; subtasks: { id: string; title: string; done: boolean }[] }

export const initialTasks: Task[] = []
