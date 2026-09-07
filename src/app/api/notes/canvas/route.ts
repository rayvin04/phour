import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { canvasStateRepository } from '@/lib/appwrite/repositories/notes.repository'

export async function PUT(request: Request) {
  try {
    const userId = await requireClerkUserId()
    const body = await request.json() as { zoom?: number; panX?: number; panY?: number }
    const data = { zoom: typeof body.zoom === 'number' ? body.zoom : 1, panX: typeof body.panX === 'number' ? body.panX : 0, panY: typeof body.panY === 'number' ? body.panY : 0 }
    const current = await canvasStateRepository.list(userId)
    return NextResponse.json(current[0] ? await canvasStateRepository.update(userId, current[0].$id, data) : await canvasStateRepository.create(userId, data))
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save canvas state.' }, { status: 400 }) }
}