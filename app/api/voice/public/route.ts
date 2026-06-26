import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getVoiceAgent } from '@/lib/ai/voice-db'
import { getAiFeatureFlags } from '@/lib/ai/feature-flags'

/** GET /api/voice/public?websiteId= — embed için herkese açık sesli asistan meta */
export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get('websiteId')
  if (!websiteId) return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })

  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { id: true, name: true },
  })
  if (!website) return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })

  const flags = await getAiFeatureFlags(website.id)
  if (!flags.voiceAgentEnabled) {
    return NextResponse.json({ error: 'Sesli asistan kapalı' }, { status: 403 })
  }

  const agent = await getVoiceAgent(website.id)
  if (!agent?.isActive) {
    return NextResponse.json({ error: 'Sesli asistan aktif değil' }, { status: 403 })
  }

  return NextResponse.json({
    siteName: website.name,
    agent: {
      name: agent.name,
      greeting: agent.greeting,
      language: agent.language,
    },
  })
}
