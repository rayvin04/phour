import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { tasksRepository } from '@/lib/appwrite/repositories/tasks.repository'
import { validateTask } from '@/features/tasks/validation'
import { AppwriteError } from '@/lib/appwrite/client'
export async function GET() { try { return NextResponse.json(await tasksRepository.list(await requireClerkUserId())) } catch (error) { return failure(error) } }
export async function POST(request: Request) { try { const userId = await requireClerkUserId(); const input = validateTask(await request.json()); return NextResponse.json(await tasksRepository.create(userId, input), { status: 201 }) } catch (error) { return failure(error) } }
function failure(error: unknown) { const message = error instanceof Error ? error.message : 'Unexpected server error.'; const status = error instanceof AppwriteError ? error.status : message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400; return NextResponse.json({ error: message }, { status }) }
