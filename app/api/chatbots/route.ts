import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const chatbotSchema = z.object({
  websiteId: z.string(),
  name: z.string().min(1, 'Chatbot adı gerekli'),
  description: z.string().optional(),
  trigger: z.enum(['ALL_CONVERSATIONS', 'OFFLINE_ONLY', 'KEYWORD', 'FIRST_VISIT']).default('ALL_CONVERSATIONS'),
  steps: z.array(z.object({
    type: z.enum(['MESSAGE', 'CHOICE', 'COLLECT_EMAIL', 'COLLECT_NAME', 'ASSIGN_AGENT', 'END']),
    message: z.string().optional(),
    options: z.any().optional(),
    order: z.number(),
  })).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')
  if (!websiteId) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const chatbots = await prisma.chatbot.findMany({
    where: { websiteId },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(chatbots)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = chatbotSchema.parse(body)

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: validated.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Chatbot oluşturma yetkiniz yok' }, { status: 403 })

    const { steps, ...chatbotData } = validated
    const chatbot = await prisma.chatbot.create({
      data: {
        ...chatbotData,
        steps: steps ? { create: steps } : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(chatbot, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    console.error('Create chatbot error:', error)
    return NextResponse.json({ error: 'Chatbot oluşturulamadı' }, { status: 500 })
  }
}