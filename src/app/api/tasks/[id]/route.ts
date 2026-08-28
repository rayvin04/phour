import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { tasksRepository } from '@/lib/appwrite/repositories/tasks.repository'
import { validateTaskUpdate } from '@/features/tasks/validation'
import { AppwriteError } from '@/lib/appwrite/client'
export async function PATCH(request: Request, context: RouteContext<'/api/tasks/[id]'>) { try { const { id } = await context.params; const body = await request.json(); const userId = await requireClerkUserId(); return NextResponse.json(await tasksRepository.update(userId, id, validateTaskUpdate(body))) } catch (error) { return failure(error) } }
export async function DELETE(_request: Request, context: RouteContext<'/api/tasks/[id]'>) { try { const { id } = await context.params; await tasksRepository.remove(await requireClerkUserId(), id); return new NextResponse(null, { status: 204 }) } catch (error) { return failure(error) } }
function failure(error: unknown) { const message = error instanceof Error ? error.message : 'Unexpected server error.'; const status = error instanceof AppwriteError ? error.status : message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400; return NextResponse.json({ error: message }, { status }) }
