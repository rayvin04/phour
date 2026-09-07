import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { appwriteConfig } from '@/lib/appwrite/config'
import { noteImagesRepository } from '@/lib/appwrite/repositories/notes.repository'

export async function GET(request: Request, context: RouteContext<'/api/notes/images/[id]'>) {
  try {
    const image = await noteImagesRepository.get(await requireClerkUserId(), (await context.params).id)
    const config = appwriteConfig()
    const url = new URL(request.url)
    const endpoint = url.searchParams.get('download') === '1' ? 'download' : 'view'
    const response = await fetch(`${config.endpoint}/storage/buckets/${image.bucketId}/files/${image.storageFileId}/${endpoint}`, { headers: { 'X-Appwrite-Project': config.projectId, 'X-Appwrite-Key': config.apiKey } })
    if (!response.ok) return NextResponse.json({ error: 'Unable to load canvas asset.' }, { status: response.status })
    const headers = new Headers({ 'Content-Type': image.mimeType, 'Content-Disposition': `${endpoint === 'download' ? 'attachment' : 'inline'}; filename="${encodeURIComponent(image.filename)}"`, 'Cache-Control': 'private, max-age=3600' })
    return new Response(await response.arrayBuffer(), { headers })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load canvas asset.' }, { status: 400 }) }
}

export async function PATCH(request: Request, context: RouteContext<'/api/notes/images/[id]'>) {
  try { return NextResponse.json(await noteImagesRepository.update(await requireClerkUserId(), (await context.params).id, await request.json())) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update canvas asset.' }, { status: 400 }) }
}

export async function DELETE(_request: Request, context: RouteContext<'/api/notes/images/[id]'>) {
  try { await noteImagesRepository.remove(await requireClerkUserId(), (await context.params).id); return new NextResponse(null, { status: 204 }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete canvas asset.' }, { status: 400 }) }
}