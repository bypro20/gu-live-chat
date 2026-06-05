import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')

  if (!websiteId) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  const messages = await prisma.proactiveMessage.findMany({
    where: { websiteId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(messages)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const body = await req.json()
  const { websiteId, title, message, triggerType, triggerValue, targetPages, isActive, delay, showOnce } = body

  if (!websiteId || !title || !message || !triggerType) {
    return NextResponse.json({ error: 'Eksik alanlar: websiteId, title, message, triggerType' }, { status: 400 })
  }

  const proactive = await prisma.proactiveMessage.create({
    data: {
      websiteId,
      title,
      message,
      triggerType,
      triggerValue: triggerValue || null,
      targetPages: targetPages || null,
      isActive: isActive ?? true,
      delay: delay ?? 0,
      showOnce: showOnce ?? true,
    },
  })

  return NextResponse.json(proactive)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const body = await req.json()
  const { id, title, message, triggerType, triggerValue, targetPages, isActive, delay, showOnce } = body

  if (!id) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  }

  const proactive = await prisma.proactiveMessage.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(message !== undefined && { message }),
      ...(triggerType !== undefined && { triggerType }),
      ...(triggerValue !== undefined && { triggerValue }),
      ...(targetPages !== undefined && { targetPages }),
      ...(isActive !== undefined && { isActive }),
      ...(delay !== undefined && { delay }),
      ...(showOnce !== undefined && { showOnce }),
    },
  })

  return NextResponse.json(proactive)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  }

  await prisma.proactiveMessage.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
