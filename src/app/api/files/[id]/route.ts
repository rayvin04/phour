import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { filesRepository } from '@/lib/appwrite/repositories/files.repository'
import { appwriteConfig } from '@/lib/appwrite/config'
import { AppwriteError, appwriteRequest } from '@/lib/appwrite/client'

export async function DELETE(request: Request, context: RouteContext<'/api/files/[id]'>) {
  try {
    const { id } = await context.params
    const userId = await requireClerkUserId()
    // Fetch document to get storage info
    const config = appwriteConfig()
    const collection = process.env.APPWRITE_COLLECTION_FILES
    if (!collection) return NextResponse.json({ error: 'Files collection not configured' }, { status: 500 })
    const doc = await appwriteRequest<any>(`/databases/${config.databaseId}/collections/${collection}/documents/${id}`)
    if (doc.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Delete storage file
    if (doc.bucketId && doc.storageFileId) {
      await fetch(`${config.endpoint}/storage/buckets/${doc.bucketId}/files/${doc.storageFileId}`, { method: 'DELETE', headers: { 'X-Appwrite-Project': config.projectId, 'X-Appwrite-Key': config.apiKey } })
    }

    await filesRepository.remove(userId, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return failure(error)
  }
}

export async function PATCH(request: Request, context: RouteContext<'/api/files/[id]'>) {
  try {
    const { id } = await context.params
    const userId = await requireClerkUserId()
    const body = await request.json()
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    // Support rename via displayName, and other partial updates
    const updates: any = {}
    if (typeof body.displayName === 'string') updates.filename = body.displayName
    if (typeof body.isPermanent === 'boolean') updates.isPermanent = body.isPermanent
    if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })

    const updated = await filesRepository.update(userId, id, updates)
    return NextResponse.json(updated)
  } catch (error) {
    return failure(error)
  }
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  const status = error instanceof AppwriteError ? error.status : message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ error: message }, { status })
}
