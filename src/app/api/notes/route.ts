import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { canvasStateRepository, noteImagesRepository, notesRepository, relationshipsRepository } from '@/lib/appwrite/repositories/notes.repository'

export async function GET() {
  try {
    const userId = await requireClerkUserId()
    const [notes, images, relationships, canvas] = await Promise.all([
      notesRepository.list(userId),
      noteImagesRepository.list(userId),
      relationshipsRepository.list(userId),
      canvasStateRepository.list(userId),
    ])
    return NextResponse.json({ notes, images, relationships, canvas: canvas[0] || null })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load notes.' }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireClerkUserId()
    const body = await request.json() as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title.trim() : 'Untitled note'
    if (title.length > 120) throw new Error('Note title is too long.')
    const requestedType = body.type === 'task' || body.type === 'habit' ? body.type : 'normal'
    const result = await notesRepository.create(userId, {
      title: title || 'Untitled note', content: typeof body.content === 'string' ? body.content : '',
      color: typeof body.color === 'string' ? body.color : '#a9d6ff', type: requestedType,
      x: typeof body.x === 'number' ? body.x : 120, y: typeof body.y === 'number' ? body.y : 120,
      width: typeof body.width === 'number' ? body.width : 260, height: typeof body.height === 'number' ? body.height : 190,
      zIndex: typeof body.zIndex === 'number' ? body.zIndex : 0,
      rotation: typeof body.rotation === 'number' ? body.rotation : 0,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create note.' }, { status: 400 })
  }
}