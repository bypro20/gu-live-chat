import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'
import { PLAN_LIMITS } from '@/lib/constants'
import { uploadFileBuffer } from '@/lib/file-upload'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req)
    if (await isIpBanned(clientIp)) {
      return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const websiteId = formData.get('websiteId') as string | null

    if (!websiteId) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true },
    })
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    if (!PLAN_LIMITS[website.plan].fileUpload) {
      return NextResponse.json(
        { error: 'Dosya yükleme bu plan kapsamında mevcut değil' },
        { status: 403 }
      )
    }

    if (!file) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Dosya boyutu 10MB'dan küçük olmalı" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya türü. Görsel, PDF veya doküman gönderebilirsiniz.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = (file.name || 'dosya').replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${Date.now()}-${safeName}`

    const result = await uploadFileBuffer({
      buffer,
      safeFileName: fileName,
      originalName: file.name,
      mimeType: file.type,
      keyPrefix: `uploads/widget/${websiteId}`,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'STORAGE_NOT_CONFIGURED') {
      return NextResponse.json(
        {
          error: 'Dosya yükleme şu an yapılandırılmamış. Vercel Blob veya AWS S3 gerekli.',
          code: 'STORAGE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }
    console.error('Widget upload error:', error)
    return NextResponse.json({ error: 'Dosya yüklenemedi' }, { status: 500 })
  }
}
