import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { relationshipsRepository } from '@/lib/appwrite/repositories/notes.repository'

export async function POST(request: Request) {
  try {
    const userId = await requireClerkUserId()
    const body = await request.json() as { noteId?: unknown; entityType?: unknown; entityId?: unknown }
    if (typeof body.noteId !== 'string' || (body.entityType !== 'task' && body.entityType !== 'habit') || typeof body.entityId !== 'string') throw new Error('Invalid note relationship.')
    return NextResponse.json(await relationshipsRepository.create(userId, { noteId: body.noteId, entityType: body.entityType, entityId: body.entityId }), { status: 201 })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create relationship.' }, { status: 400 }) }
}