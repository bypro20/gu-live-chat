import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateAiReply } from '@/lib/ai/provider'
import { websiteHasAiAssistant } from '@/lib/plan-features'

/** POST /api/ai/suggest — temsilci için yanıt önerisi */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const body = await req.json()
    const { websiteId, context, visitorActivity } = body

    if (!websiteId || !context) {
      return NextResponse.json({ error: 'websiteId ve context gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        plan: true,
        members: { where: { userId: session.user.id } },
        aiConfig: true,
      },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const isOwner = website.ownerId === session.user.id
    const isMember = website.members.length > 0
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
    }

    const hasAI = await websiteHasAiAssistant(website.id, website.plan)
    if (!hasAI) {
      return NextResponse.json({
        error: 'AI asistan profesyonel ve iş paketlerinde kullanılabilir',
        upgradeRequired: true,
        requiredPlan: 'PRO',
      }, { status: 403 })
    }

    const aiConfig = website.aiConfig
    if (!aiConfig || !aiConfig.isActive) {
      return NextResponse.json({ error: 'AI yapılandırması aktif değil' }, { status: 400 })
    }
    if (!aiConfig.autoSuggest) {
      return NextResponse.json({ error: 'AI öneri özelliği kapalı' }, { status: 403 })
    }

    const fullContext = visitorActivity
      ? `${context}\n\nZiyaretçi aktiviteleri:\n${visitorActivity}`
      : context

    const suggestPrompt =
      (aiConfig.systemPrompt || '') +
      '\n\nGörev: Aşağıdaki sohbet bağlamına uygun, müşteriye gönderilecek kısa bir yanıt taslağı yaz. Sadece mesaj metnini ver, açıklama yapma.'

    const suggestion = await generateAiReply({
      siteName: website.name,
      messages: [{ role: 'user', content: fullContext }],
      dbConfig: {
        provider: aiConfig.provider,
        model: aiConfig.model,
        apiKey: aiConfig.apiKey,
        temperature: aiConfig.temperature,
      },
      systemPrompt: suggestPrompt,
      websiteId: website.id,
    })

    return NextResponse.json({ suggestion: suggestion.trim() })
  } catch (error) {
    console.error('[AI Suggest] Error:', error)
    return NextResponse.json({ error: 'AI önerisi oluşturulamadı' }, { status: 500 })
  }
}
