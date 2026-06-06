import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { chatbotId } = await params
  const { searchParams } = new URL(req.url)
  const websiteIdParam = searchParams.get('websiteId')
  if (!websiteIdParam) {
    return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteIdParam)
  if (!website) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'chatbot')
  if (planDenied) return planDenied

  const body = await req.json().catch(() => ({}))
  const chatbot = await prisma.chatbot.findFirst({
    where: { id: chatbotId, websiteId: website.id },
  })
  if (!chatbot) {
    return NextResponse.json({ error: 'Chatbot bulunamadı' }, { status: 404 })
  }

  const updated = await prisma.chatbot.update({
    where: { id: chatbotId },
    data: {
      ...(typeof body.isActive === 'boolean' && { isActive: body.isActive }),
      ...(typeof body.name === 'string' && body.name.trim() && { name: body.name.trim() }),
    },
    include: { steps: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { chatbotId } = await params
  const { searchParams } = new URL(req.url)
  const websiteIdParam = searchParams.get('websiteId')

  if (!websiteIdParam) {
    return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteIdParam)
  if (!website) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'chatbot')
  if (planDenied) return planDenied

  const chatbot = await prisma.chatbot.findFirst({
    where: { id: chatbotId, websiteId: website.id },
  })
  if (!chatbot) {
    return NextResponse.json({ error: 'Chatbot bulunamadı' }, { status: 404 })
  }

  await prisma.chatbot.delete({ where: { id: chatbotId } })
  return NextResponse.json({ success: true })
}
