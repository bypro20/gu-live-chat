import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getEnvProviderStatus } from '@/lib/ai/provider'

// GET /api/ai/config?websiteId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const websiteId = searchParams.get('websiteId')
    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

    // Verify ownership/membership
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, ownerId: true, members: { where: { userId: session.user.id } } },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const isOwner = website.ownerId === session.user.id
    const isMember = website.members.length > 0
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
    }

    const aiConfig = await prisma.aIConfig.findUnique({
      where: { websiteId: website.id },
    })

    // Whether server-side env API keys are defined (value never exposed).
    const env = getEnvProviderStatus()

    if (!aiConfig) {
      // Return default config
      return NextResponse.json({
        env,
        aiConfig: {
          id: null,
          isActive: false,
          provider: 'OPENAI',
          model: 'gpt-4o-mini',
          apiKey: '',
          temperature: 0.7,
          systemPrompt: '',
          autoSuggest: true,
          autoReply: false,
        },
      })
    }

    // Mask API key for security
    const maskedKey = aiConfig.apiKey
      ? aiConfig.apiKey.substring(0, 8) + '...' + aiConfig.apiKey.substring(aiConfig.apiKey.length - 4)
      : ''

    return NextResponse.json({
      env,
      aiConfig: {
        ...aiConfig,
        apiKey: maskedKey,
        _hasApiKey: !!aiConfig.apiKey,
      },
    })
  } catch (error) {
    console.error('[AI Config GET] Error:', error)
    return NextResponse.json({ error: 'AI yapılandırması alınamadı' }, { status: 500 })
  }
}

// PUT /api/ai/config
// Body: { websiteId, isActive, provider, model, apiKey, temperature, systemPrompt, autoSuggest, autoReply }
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const body = await req.json()
    const { websiteId, isActive, provider, model, apiKey, temperature, systemPrompt, autoSuggest, autoReply } = body

    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

    // Verify ownership (only owners can configure AI)
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, ownerId: true, members: { where: { userId: session.user.id } } },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const isOwner = website.ownerId === session.user.id
    const isMember = website.members.length > 0
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
    }

    // Build update data — don't update apiKey if it's masked (contains '...')
    const data: any = {}
    if (isActive !== undefined) data.isActive = isActive
    if (provider) data.provider = provider
    if (model) data.model = model
    if (apiKey && !apiKey.includes('...')) data.apiKey = apiKey
    if (temperature !== undefined) data.temperature = temperature
    if (systemPrompt !== undefined) data.systemPrompt = systemPrompt
    if (autoSuggest !== undefined) data.autoSuggest = autoSuggest
    if (autoReply !== undefined) data.autoReply = autoReply

    // Upsert: create if not exists, update if exists
    const aiConfig = await prisma.aIConfig.upsert({
      where: { websiteId: website.id },
      update: data,
      create: {
        websiteId: website.id,
        isActive: isActive ?? false,
        provider: provider ?? 'OPENAI',
        model: model ?? 'gpt-4o-mini',
        apiKey: apiKey || '',
        temperature: temperature ?? 0.7,
        systemPrompt: systemPrompt ?? '',
        autoSuggest: autoSuggest ?? true,
        autoReply: autoReply ?? false,
      },
    })

    // Return masked key
    const maskedKey = aiConfig.apiKey
      ? aiConfig.apiKey.substring(0, 8) + '...' + aiConfig.apiKey.substring(aiConfig.apiKey.length - 4)
      : ''

    return NextResponse.json({
      aiConfig: {
        ...aiConfig,
        apiKey: maskedKey,
        _hasApiKey: !!aiConfig.apiKey,
      },
    })
  } catch (error) {
    console.error('[AI Config PUT] Error:', error)
    return NextResponse.json({ error: 'AI yapılandırması kaydedilemedi' }, { status: 500 })
  }
}