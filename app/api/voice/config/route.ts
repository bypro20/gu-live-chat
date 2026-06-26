import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { getVoiceAgent, upsertVoiceAgent } from '@/lib/ai/voice-db'
import { getAiFeatureFlags, saveAiFeatureFlags } from '@/lib/ai/feature-flags'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const websiteId = req.nextUrl.searchParams.get('websiteId')
  if (!websiteId) return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })

  const website = await resolveWebsite(websiteId)
  if (!website) return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const agent = await getVoiceAgent(website.id)
  const flags = await getAiFeatureFlags(website.id)

  return NextResponse.json({
    agent: agent ?? {
      isActive: false,
      name: 'Sesli Asistan',
      greeting: 'Merhaba, size nasıl yardımcı olabilirim?',
      systemPrompt: '',
      language: 'tr-TR',
      voiceStyle: 'friendly',
    },
    voiceAgentEnabled: flags.voiceAgentEnabled,
    embedUrl: `/voice/${websiteId}`,
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const websiteId = body.websiteId as string
    if (!websiteId) return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })

    const website = await resolveWebsite(websiteId)
    if (!website) return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    if (body.voiceAgentEnabled !== undefined) {
      await saveAiFeatureFlags(website.id, { voiceAgentEnabled: !!body.voiceAgentEnabled })
    }

    const agent = await upsertVoiceAgent(website.id, {
      isActive: body.isActive,
      name: body.name,
      greeting: body.greeting,
      systemPrompt: body.systemPrompt,
      language: body.language,
      voiceStyle: body.voiceStyle,
    })

    return NextResponse.json({ success: true, agent })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kaydedilemedi' },
      { status: 500 }
    )
  }
}
