import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { notesRepository } from '@/lib/appwrite/repositories/notes.repository'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await notesRepository.update(await requireClerkUserId(), (await params).id, await request.json())
    return NextResponse.json(result)
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update note.' }, { status: 400 }) }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await notesRepository.remove(await requireClerkUserId(), (await params).id); return new NextResponse(null, { status: 204 }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete note.' }, { status: 400 }) }
}