import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'
import { PLAN_LIMITS } from '@/lib/constants'

// Public upload endpoint used by the chat widget (visitors are NOT
// authenticated). Uploads are scoped to a valid website and validated for
// size/type. Mirrors the authenticated /api/upload S3 → local fallback.
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

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function getS3Client() {
  const region = process.env.AWS_REGION || 'eu-central-1'
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    return null
  }
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

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

    // Tenant scoping: only allow uploads for an existing website.
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true },
    })
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    // Plan gate: fileUpload feature required
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

    const s3 = getS3Client()
    const onVercel = !!process.env.VERCEL
    if (!s3 && onVercel) {
      return NextResponse.json(
        {
          error: 'Dosya yükleme şu an yapılandırılmamış. AWS S3 ayarlarını kontrol edin.',
          code: 'STORAGE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    if (s3 && process.env.AWS_S3_BUCKET) {
      const key = `uploads/widget/${websiteId}/${fileName}`
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      )
      const baseUrl = process.env.AWS_S3_PUBLIC_URL || `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com`
      const url = `${baseUrl}/${key}`
      return NextResponse.json({ url, fileName: file.name, fileSize: file.size, mimeType: file.type })
    }

    // Local fallback for dev / deployments without S3.
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'widget')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, fileName), buffer)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const url = appUrl ? `${appUrl}/uploads/widget/${fileName}` : `/uploads/widget/${fileName}`

    return NextResponse.json({ url, fileName: file.name, fileSize: file.size, mimeType: file.type })
  } catch (error) {
    console.error('Widget upload error:', error)
    return NextResponse.json({ error: 'Dosya yüklenemedi' }, { status: 500 })
  }
}
