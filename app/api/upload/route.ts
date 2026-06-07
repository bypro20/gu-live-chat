import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFileBuffer } from '@/lib/file-upload'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya boyutu 10MB'dan küçük olmalı" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Desteklenmeyen dosya türü' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = (file.name || 'dosya').replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${Date.now()}-${safeName}`

    const result = await uploadFileBuffer({
      buffer,
      safeFileName: fileName,
      originalName: file.name,
      mimeType: file.type,
      keyPrefix: `uploads/${session.user.id}`,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'STORAGE_NOT_CONFIGURED') {
      return NextResponse.json(
        {
          error: 'Dosya yükleme yapılandırılmamış. Vercel Blob veya AWS S3 ekleyin.',
          code: 'STORAGE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Dosya yüklenemedi' }, { status: 500 })
  }
}
