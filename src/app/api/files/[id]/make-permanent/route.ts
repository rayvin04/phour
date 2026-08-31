import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { filesRepository } from '@/lib/appwrite/repositories/files.repository'

export async function POST(request: Request, context: RouteContext<'/api/files/[id]/make-permanent'>) {
  try {
    const { id } = await context.params
    const userId = await requireClerkUserId()
    const updated = await filesRepository.update(userId, id, { isPermanent: true, expiresAt: '' })
    return NextResponse.json(updated)
  } catch (error) {
    return failure(error)
  }
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ error: message }, { status })
}
