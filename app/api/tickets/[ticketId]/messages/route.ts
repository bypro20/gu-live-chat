import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1, 'Mesaj gerekli'),
  isInternal: z.boolean().default(false),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { ticketId } = await params

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return NextResponse.json({ error: 'Ticket bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: ticket.websiteId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      attachments: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(messages)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { ticketId } = await params

  try {
    const body = await req.json()
    const validated = createMessageSchema.parse(body)

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) return NextResponse.json({ error: 'Ticket bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: ticket.websiteId, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        content: validated.content,
        senderType: 'AGENT',
        senderId: session.user.id,
        isInternal: validated.isInternal,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        attachments: true,
      },
    })

    if (!validated.isInternal && ticket.status === 'NEW') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'OPEN', firstResponseAt: new Date() },
      })
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz mesaj', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 })
  }
}
