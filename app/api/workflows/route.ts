import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { z } from 'zod'

const workflowSchema = z.object({
  websiteId: z.string(),
  name: z.string().min(1, 'İş akışı adı gerekli'),
  description: z.string().optional(),
  triggerType: z.enum([
    'CONVERSATION_CREATED', 'CONVERSATION_RESOLVED', 'CONVERSATION_CLOSED',
    'MESSAGE_RECEIVED', 'VISITOR_CREATED', 'VISITOR_SEEN_PAGE',
    'TICKET_CREATED', 'TICKET_UPDATED', 'SCHEDULED', 'WEBHOOK_RECEIVED',
  ]),
  triggerConfig: z.string().optional(),
  isActive: z.boolean().default(true),
  steps: z.array(z.object({
    order: z.number(),
    actionType: z.enum([
      'SEND_MESSAGE', 'SEND_EMAIL', 'ASSIGN_AGENT', 'CHANGE_STATUS',
      'SET_PRIORITY', 'ADD_TAG', 'REMOVE_TAG', 'FORWARD_TO_WEBHOOK',
      'ADD_NOTE', 'TRIGGER_CHATBOT', 'SEND_NOTIFICATION', 'DELAY', 'CONDITIONAL_BRANCH',
    ]),
    config: z.string().optional(),
    delayMs: z.number().optional(),
  })).optional(),
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

  const workflows = await prisma.workflow.findMany({
    where: { websiteId: website.id },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(workflows)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = workflowSchema.parse(body)

    const website = await resolveWebsite(validated.websiteId)
    if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'İş akışı oluşturma yetkiniz yok' }, { status: 403 })

    const { steps, ...workflowData } = validated

    const maxOrder = await prisma.workflow.aggregate({
      where: { websiteId: website.id },
      _max: { order: true },
    })

    const workflow = await prisma.workflow.create({
      data: {
        ...workflowData,
        websiteId: website.id,
        order: (maxOrder._max.order ?? -1) + 1,
        steps: steps ? { create: steps } : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    console.error('Create workflow error:', error)
    return NextResponse.json({ error: 'İş akışı oluşturulamadı' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, steps, ...updateData } = body
    if (!id) return NextResponse.json({ error: 'İş akışı ID gerekli' }, { status: 400 })

    const workflow = await prisma.workflow.findUnique({ where: { id } })
    if (!workflow) return NextResponse.json({ error: 'İş akışı bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: workflow.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        ...updateData,
        steps: steps ? {
          deleteMany: {},
          create: steps,
        } : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    console.error('Update workflow error:', error)
    return NextResponse.json({ error: 'İş akışı güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'İş akışı ID gerekli' }, { status: 400 })

  const workflow = await prisma.workflow.findUnique({ where: { id } })
  if (!workflow) return NextResponse.json({ error: 'İş akışı bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: workflow.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

  await prisma.workflow.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
