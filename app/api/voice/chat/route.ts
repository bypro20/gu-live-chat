import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateAiReply } from '@/lib/ai/provider'
import { loadRelevantKnowledge } from '@/lib/ai/knowledge'
import { getVoiceAgent } from '@/lib/ai/voice-db'
import { getAiFeatureFlags } from '@/lib/ai/feature-flags'
import { fetchWebContext } from '@/lib/ai/web-search'
import type { PlanType } from '@/lib/constants'

/** POST /api/voice/chat — sesli asistan metin döngüsü (STT/TTS istemcide) */
export async function POST(req: NextRequest) {
  try {
    const { websiteId, message, history } = await req.json()
    if (!websiteId || !message?.trim()) {
      return NextResponse.json({ error: 'websiteId ve message gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, name: true, plan: true, aiConfig: true },
    })
    if (!website) return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })

    const flags = await getAiFeatureFlags(website.id)
    if (!flags.voiceAgentEnabled) {
      return NextResponse.json({ error: 'Sesli asistan kapalı' }, { status: 403 })
    }

    const agent = await getVoiceAgent(website.id)
    if (!agent?.isActive) {
      return NextResponse.json({ error: 'Sesli asistan yapılandırılmamış' }, { status: 403 })
    }

    const aiConfig = website.aiConfig
    const dbConfig = aiConfig
      ? {
          provider: aiConfig.provider,
          model: aiConfig.model,
          apiKey: aiConfig.apiKey,
          temperature: aiConfig.temperature,
        }
      : null

    const knowledge = await loadRelevantKnowledge(website.id, message, 6)
    let visitorContext = ''
    if (flags.webSearchEnabled) {
      const web = await fetchWebContext(message)
      if (web) visitorContext = `Web araması:\n${web}`
    }

    const prior = Array.isArray(history)
      ? (history as Array<{ role: string; content: string }>)
          .slice(-8)
          .map((m) => ({
            role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
            content: String(m.content || ''),
          }))
      : []

    const messages = [...prior, { role: 'user' as const, content: message.trim() }]

    const reply = await generateAiReply({
      siteName: website.name,
      messages,
      knowledge,
      visitorContext: visitorContext || undefined,
      systemPrompt:
        agent.systemPrompt ||
        `${agent.name} olarak kısa, konuşma dilinde yanıt ver. Telefon görüşmesi gibi net konuş.`,
      dbConfig,
      plan: website.plan as PlanType,
      smartRoutingEnabled: flags.smartRoutingEnabled,
      maxTokens: 280,
    })

    return NextResponse.json({ reply: reply?.trim() || agent.greeting })
  } catch (err) {
    console.error('[voice/chat]', err)
    return NextResponse.json({ error: 'Yanıt üretilemedi' }, { status: 500 })
  }
}
