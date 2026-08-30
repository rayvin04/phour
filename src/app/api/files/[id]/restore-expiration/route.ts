import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { filesRepository } from '@/lib/appwrite/repositories/files.repository'

export async function POST(request: Request, context: RouteContext<'/api/files/[id]/restore-expiration'>) {
  try {
    const { id } = await context.params
    const userId = await requireClerkUserId()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const updated = await filesRepository.update(userId, id, { isPermanent: false, expiresAt })
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
