import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { filesRepository } from '@/lib/appwrite/repositories/files.repository'
import { Query } from '@/lib/appwrite/repositories/base.repository'
import { AppwriteError } from '@/lib/appwrite/client'
import { appwriteConfig, collectionId } from '@/lib/appwrite/config'

export async function GET() {
  try {
    const userId = await requireClerkUserId()
    const files = await filesRepository.list(userId, [Query.orderDesc('$createdAt')])
    return NextResponse.json(files, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireClerkUserId()

    // Read metadata headers if sent by client
    const headerName = request.headers.get('x-file-name')
    const headerSize = request.headers.get('x-file-size')
    const headerType = request.headers.get('x-file-type')

    const rawFileName = headerName ? decodeURIComponent(headerName) : ''
    const rawFileSize = headerSize ? Number(headerSize) : 0
    const rawMimeType = headerType || ''

    const bucketId = process.env.APPWRITE_BUCKET_FILES
    if (!bucketId) return NextResponse.json({ error: 'Storage bucket not configured' }, { status: 500 })

    // Validate current user storage quota
    const stats = await filesRepository.list(userId)
    const used = stats.reduce((s, f) => s + (f.size || 0), 0)
    const maxTotal = 500 * 1024 * 1024
    if (rawFileSize > 0 && used + rawFileSize > maxTotal) {
      return NextResponse.json({ error: 'Uploading this file would exceed your 500 MB quota' }, { status: 403 })
    }

    // Size limits by MIME category
    if (rawMimeType.startsWith('video/') && rawFileSize > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'Videos must be <= 100 MB' }, { status: 413 })
    }
    if (rawMimeType.startsWith('image/') && rawFileSize > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Images must be <= 20 MB' }, { status: 413 })
    }
    const docTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]
    if (
      !rawMimeType.startsWith('image/') &&
      !rawMimeType.startsWith('video/') &&
      !docTypes.includes(rawMimeType) &&
      rawFileSize > 25 * 1024 * 1024
    ) {
      return NextResponse.json({ error: 'Files of this type must be <= 25 MB' }, { status: 413 })
    }

    const config = appwriteConfig()
    const contentType = request.headers.get('content-type') || ''
    const uploadUrl = `${config.endpoint}/storage/buckets/${bucketId}/files`

    if (!request.body) {
      return NextResponse.json({ error: 'No request body' }, { status: 400 })
    }

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: request.body,
      // @ts-expect-error — duplex is required in Node 18+ when streaming a body
      duplex: 'half',
      headers: {
        'Content-Type': contentType,
        'X-Appwrite-Project': config.projectId,
        'X-Appwrite-Key': config.apiKey,
        'X-Appwrite-Response-Format': '1.9.6',
      },
    })

    if (!uploadRes.ok) {
      const body = await uploadRes.text().catch(() => '')
      throw new AppwriteError(body || 'Upload to storage failed', uploadRes.status)
    }
    const uploaded = await uploadRes.json()

    // Determine final metadata combining headers and storage response
    const finalFilename = rawFileName || uploaded.name || uploaded.$id || 'untitled'
    const finalSize = rawFileSize || uploaded.sizeOriginal || 0
    const finalMime = rawMimeType || uploaded.mimeType || 'application/octet-stream'

    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const meta = await filesRepository.create(userId, {
      filename: finalFilename,
      originalFilename: finalFilename,
      mimeType: finalMime,
      size: finalSize,
      bucketId,
      storageFileId: uploaded.$id,
      uploadedAt: now,
      expiresAt,
      isPermanent: false,
      previewUrl: `/api/files/preview/${uploaded.$id}`,
    })

    return NextResponse.json(meta, { status: 201 })
  } catch (error) {
    return failure(error)
  }
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  const status = error instanceof AppwriteError ? error.status : message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ error: message }, { status })
}
