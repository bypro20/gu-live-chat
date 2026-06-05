import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createTicketSchema = z.object({
  websiteId: z.string(),
  requesterEmail: z.string().email('Geçerli bir e-posta girin'),
  requesterName: z.string().optional(),
  subject: z.string().min(1, 'Konu gerekli'),
  description: z.string().optional(),
  channel: z.enum(['EMAIL', 'WIDGET', 'API', 'WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'IMPORT']).default('EMAIL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedToId: z.string().optional(),
  ccAddresses: z.string().optional(),
})

const updateTicketSchema = z.object({
  subject: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['NEW', 'OPEN', 'PENDING_CUSTOMER', 'PENDING_AGENT', 'ON_HOLD', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().nullable().optional(),
  ccAddresses: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!websiteId) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const where: Record<string, unknown> = { websiteId }

  if (status) where.status = status
  if (priority) where.priority = priority
  if (search) {
    where.OR = [
      { subject: { contains: search } },
      { requesterEmail: { contains: search } },
      { requesterName: { contains: search } },
    ]
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ])

  return NextResponse.json({
    tickets,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = createTicketSchema.parse(body)

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: validated.websiteId, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const ticket = await prisma.ticket.create({
      data: {
        websiteId: validated.websiteId,
        requesterEmail: validated.requesterEmail,
        requesterName: validated.requesterName,
        subject: validated.subject,
        description: validated.description,
        channel: validated.channel,
        priority: validated.priority,
        assignedToId: validated.assignedToId,
        ccAddresses: validated.ccAddresses,
        status: 'NEW',
      },
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ticket oluşturulamadı' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'Ticket ID gerekli' }, { status: 400 })

    const validated = updateTicketSchema.parse(data)

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: ticket.websiteId, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const updateData: Record<string, unknown> = {}
    if (validated.subject !== undefined) updateData.subject = validated.subject
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.priority !== undefined) updateData.priority = validated.priority
    if (validated.assignedToId !== undefined) updateData.assignedToId = validated.assignedToId
    if (validated.ccAddresses !== undefined) updateData.ccAddresses = validated.ccAddresses

    if (validated.status === 'RESOLVED') updateData.resolvedAt = new Date()
    if (validated.status === 'CLOSED') updateData.closedAt = new Date()

    if (validated.tagIds !== undefined) {
      await prisma.ticketTag.deleteMany({ where: { ticketId: id } })
      if (validated.tagIds.length > 0) {
        await prisma.ticketTag.createMany({
          data: validated.tagIds.map((tagId: string) => ({ ticketId: id, tagId })),
        })
      }
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ticket güncellenemedi' }, { status: 500 })
  }
}
