import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { appwriteConfig, collectionId } from '@/lib/appwrite/config'
import { appwriteRequest } from '@/lib/appwrite/client'

export async function GET(request: Request, context: RouteContext<'/api/files/preview/[id]'>) {
  try {
    const { id } = await context.params
    const userId = await requireClerkUserId()
    const config = appwriteConfig()
    const filesCol = collectionId('files')

    // Fetch document metadata
    const doc = await appwriteRequest<any>(`/databases/${config.databaseId}/collections/${filesCol}/documents/${id}`)
    if (!doc || doc.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!doc.bucketId || !doc.storageFileId) return NextResponse.json({ error: 'No storage information' }, { status: 404 })

    const url = new URL(request.url)
    const isDownload = url.searchParams.get('download') === '1'
    const isView = url.searchParams.get('view') === '1'

    const authHeaders = {
      'X-Appwrite-Project': config.projectId,
      'X-Appwrite-Key': config.apiKey,
    }

    let targetUrl: string
    if (isDownload) {
      targetUrl = `${config.endpoint}/storage/buckets/${doc.bucketId}/files/${doc.storageFileId}/download`
    } else if (isView) {
      targetUrl = `${config.endpoint}/storage/buckets/${doc.bucketId}/files/${doc.storageFileId}/view`
    } else {
      // Default: try /preview first (image/pdf thumbnails)
      targetUrl = `${config.endpoint}/storage/buckets/${doc.bucketId}/files/${doc.storageFileId}/preview?width=600&height=450`
    }

    let res = await fetch(targetUrl, { headers: authHeaders })

    // If preview endpoint fails (e.g. unsupported type for thumbnail), fallback to /view
    if (!res.ok && !isDownload && !isView) {
      targetUrl = `${config.endpoint}/storage/buckets/${doc.bucketId}/files/${doc.storageFileId}/view`
      res = await fetch(targetUrl, { headers: authHeaders })
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return NextResponse.json({ error: body || 'File retrieval failed' }, { status: res.status })
    }

    const arrayBuffer = await res.arrayBuffer()
    const headers = new Headers()
    const contentType = res.headers.get('content-type') || doc.mimeType || 'application/octet-stream'
    headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')

    const safeFilename = encodeURIComponent(doc.filename || 'file')
    if (isDownload) {
      headers.set('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`)
    } else {
      headers.set('Content-Disposition', `inline; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`)
    }

    return new Response(arrayBuffer, { headers })
  } catch (error) {
    return failure(error)
  }
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ error: message }, { status })
}
