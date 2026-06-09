import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'
import { sessionIsPlatformAdmin } from '@/lib/platform-admin'
import { z } from 'zod'

const cannedResponseSchema = z.object({
  websiteId: z.string(),
  title: z.string().min(1, 'Başlık gerekli'),
  content: z.string().min(1, 'İçerik gerekli'),
  shortcut: z.string().optional(),
  category: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteIdParam = searchParams.get('websiteId')
  if (!websiteIdParam) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const website = await resolveWebsite(websiteIdParam)
  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  if (!(await sessionIsPlatformAdmin())) {
    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'cannedResponses')
    if (planDenied) return planDenied
  }

  const responses = await prisma.cannedResponse.findMany({
    where: { websiteId: website.id },
    orderBy: { title: 'asc' },
  })

  return NextResponse.json(responses)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = cannedResponseSchema.parse(body)

    const website = await resolveWebsite(validated.websiteId)
    if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    if (!(await sessionIsPlatformAdmin())) {
      const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'cannedResponses')
      if (planDenied) return planDenied
    }

    const response = await prisma.cannedResponse.create({ data: { ...validated, websiteId: website.id } })
    return NextResponse.json(response, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Hazır cevap oluşturulamadı' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const websiteIdParam = searchParams.get('websiteId')
  if (!id || !websiteIdParam) {
    return NextResponse.json({ error: 'id ve websiteId gerekli' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteIdParam)
  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  if (!(await sessionIsPlatformAdmin())) {
    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'cannedResponses')
    if (planDenied) return planDenied
  }

  const existing = await prisma.cannedResponse.findFirst({
    where: { id, websiteId: website.id },
  })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await prisma.cannedResponse.delete({ where: { id } })
  return NextResponse.json({ success: true })
}