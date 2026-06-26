import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'

const createTagSchema = z.object({
  websiteId: z.string(),
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteIdParam = searchParams.get('websiteId')
  if (!websiteIdParam) {
    return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteIdParam)
  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const tags = await prisma.tag.findMany({
    where: { websiteId: website.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, color: true },
  })

  return NextResponse.json({ tags })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = createTagSchema.parse(body)

    const website = await resolveWebsite(validated.websiteId)
    if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const tag = await prisma.tag.upsert({
      where: {
        websiteId_name: {
          websiteId: website.id,
          name: validated.name,
        },
      },
      create: {
        websiteId: website.id,
        name: validated.name,
        color: validated.color || '#146356',
      },
      update: {
        ...(validated.color ? { color: validated.color } : {}),
      },
      select: { id: true, name: true, color: true },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz etiket verisi' }, { status: 400 })
    }
    console.error('Tag create error:', error)
    return NextResponse.json({ error: 'Etiket oluşturulamadı' }, { status: 500 })
  }
}
