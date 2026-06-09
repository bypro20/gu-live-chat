import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'
import { canManageChatbots, canViewChatbots } from '@/lib/chatbot-access'
import { syncProductionSchema } from '@/lib/db-schema-sync'
import { z } from 'zod'

const chatbotSchema = z.object({
  websiteId: z.string(),
  name: z.string().min(1, 'Chatbot adı gerekli'),
  description: z.string().optional(),
  trigger: z.enum(['ALL_CONVERSATIONS', 'OFFLINE_ONLY', 'KEYWORD', 'FIRST_VISIT']).default('ALL_CONVERSATIONS'),
  triggerValue: z.string().optional(),
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
  const websiteIdParam = searchParams.get('websiteId')
  if (!websiteIdParam) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const website = await resolveWebsite(websiteIdParam)
  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  const canView = await canViewChatbots(website, session.user.id)
  if (!canView) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'chatbot')
  if (planDenied) return planDenied

  const chatbots = await prisma.chatbot.findMany({
    where: { websiteId: website.id },
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
    await syncProductionSchema()

    const body = await req.json()
    const validated = chatbotSchema.parse(body)

    const website = await resolveWebsite(validated.websiteId)
    if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

    const canManage = await canManageChatbots(website, session.user.id)
    if (!canManage) {
      return NextResponse.json({ error: 'Chatbot oluşturma yetkiniz yok (sadece site sahibi veya yönetici)' }, { status: 403 })
    }

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'chatbot')
    if (planDenied) return planDenied

    const { steps, ...chatbotData } = validated
    const chatbot = await prisma.chatbot.create({
      data: {
        ...chatbotData,
        websiteId: website.id,
        steps: steps
          ? {
              create: steps.map((step) => ({
                type: step.type,
                message: step.message,
                order: step.order,
                options: step.options
                  ? typeof step.options === 'string'
                    ? step.options
                    : JSON.stringify(step.options)
                  : undefined,
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(chatbot, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    console.error('Create chatbot error:', error)
    const detail = error instanceof Error ? error.message : 'unknown'
    return NextResponse.json(
      { error: detail.includes('no such column') ? 'Veritabanı şeması güncelleniyor — lütfen tekrar deneyin' : 'Chatbot oluşturulamadı', detail },
      { status: 500 }
    )
  }
}