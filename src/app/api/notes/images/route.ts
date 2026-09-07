import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { appwriteConfig } from '@/lib/appwrite/config'
import { noteImagesRepository } from '@/lib/appwrite/repositories/notes.repository'

export async function POST(request: Request) {
  try {
    const userId = await requireClerkUserId()
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !(file.type.startsWith('image/') || file.type === 'application/pdf')) throw new Error('Choose an image or PDF file.')
    if (file.size > 25 * 1024 * 1024) throw new Error('Images and PDFs must be 25 MB or smaller.')
    const bucketId = process.env.APPWRITE_BUCKET_FILES
    if (!bucketId) throw new Error('Storage bucket not configured')
    const config = appwriteConfig()
    const upload = new FormData()
    upload.append('fileId', 'unique()')
    upload.append('file', file, file.name)
    const response = await fetch(`${config.endpoint}/storage/buckets/${bucketId}/files`, {
      method: 'POST', body: upload,
      headers: { 'X-Appwrite-Project': config.projectId, 'X-Appwrite-Key': config.apiKey, 'X-Appwrite-Response-Format': '1.9.6' },
    })
    if (!response.ok) throw new Error('Image upload failed.')
    const uploaded = await response.json() as { $id: string }
    const image = await noteImagesRepository.create(userId, {
      storageFileId: uploaded.$id, filename: file.name, mimeType: file.type, bucketId,
      x: Number(form.get('x') || 160), y: Number(form.get('y') || 160), width: 320, height: 220, zIndex: 0, rotation: 0,
    })
    return NextResponse.json({ ...image, bucketId }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to upload image.' }, { status: 400 }) }
}
