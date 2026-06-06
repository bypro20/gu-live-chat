import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { websiteHasAiAssistant } from '@/lib/plan-features'

// POST /api/ai/suggest
// Body: { websiteId: string, context: string, visitorActivity?: string }
// Returns: { suggestion: string }
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

    // Verify team membership
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: {
        id: true,
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

    // Build system prompt
    const defaultSystemPrompt = `Sen bir canlı destek asistanısın. Türkçe yanıt ver. Kısa, nazik ve yardımcı ol. Müşteriye doğrudan önerilen mesajı ver, açıklama yapma.`
    const systemPrompt = aiConfig.systemPrompt || defaultSystemPrompt

    // Build context
    const fullContext = visitorActivity
      ? `${context}\n\nZiyaretçi aktiviteleri:\n${visitorActivity}`
      : context

    // Call AI provider
    let suggestion = ''

    if (aiConfig.provider === 'OPENAI') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model || 'gpt-4o-mini',
          temperature: aiConfig.temperature || 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: fullContext },
          ],
          max_tokens: 256,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        console.error('[AI Suggest] OpenAI error:', err)
        return NextResponse.json({ error: 'AI servisi yanıt vermedi' }, { status: 502 })
      }

      const data = await response.json()
      suggestion = data.choices?.[0]?.message?.content?.trim() || ''
    } else if (aiConfig.provider === 'ANTHROPIC') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiConfig.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: aiConfig.model || 'claude-sonnet-4-20250514',
          max_tokens: 256,
          temperature: aiConfig.temperature || 0.7,
          system: systemPrompt,
          messages: [
            { role: 'user', content: fullContext },
          ],
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        console.error('[AI Suggest] Anthropic error:', err)
        return NextResponse.json({ error: 'AI servisi yanıt vermedi' }, { status: 502 })
      }

      const data = await response.json()
      suggestion = data.content?.[0]?.text?.trim() || ''
    }

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('[AI Suggest] Error:', error)
    return NextResponse.json({ error: 'AI önerisi oluşturulamadı' }, { status: 500 })
  }
}