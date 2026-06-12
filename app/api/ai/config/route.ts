import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getEnvProviderStatus, hasAnyPlatformAiKey, pickDefaultProvider } from '@/lib/ai/provider'
import type { AiProvider } from '@/lib/ai/provider'
import {
  clampModelToPlan,
  getAllowedPresetsForProvider,
  getAllowedProvidersForPlan,
  getDefaultModelForPlan,
  getDefaultProviderForPlan,
  getPlanAiAccess,
  isModelAllowedForPlan,
  isProviderAllowedForPlan,
} from '@/lib/ai/plan-models'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'
import { websiteHasAiAssistant } from '@/lib/plan-features'
import type { PlanType } from '@/lib/constants'

function buildPlanAiPayload(plan: PlanType) {
  const access = getPlanAiAccess(plan)
  const allowedProviders = getAllowedProvidersForPlan(plan)
  const allowedModelsByProvider = Object.fromEntries(
    allowedProviders.map((p) => [p, getAllowedPresetsForProvider(plan, p)])
  ) as Record<AiProvider, ReturnType<typeof getAllowedPresetsForProvider>>
  return { plan, planAiAccess: access, allowedProviders, allowedModelsByProvider }
}

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

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true, ownerId: true, members: { where: { userId: session.user.id } } },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const isOwner = website.ownerId === session.user.id
    const isMember = website.members.length > 0
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
    }

    const plan = website.plan as PlanType
    const planAi = buildPlanAiPayload(plan)
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { websiteId: website.id },
    })

    const envRaw = getEnvProviderStatus()
    const env = envRaw.effective ?? envRaw
    const platformReady = hasAnyPlatformAiKey()

    if (!aiConfig) {
      const defaultProvider = pickDefaultProvider() ?? getDefaultProviderForPlan(plan)
      const defaultModel = getDefaultModelForPlan(plan, defaultProvider)
      return NextResponse.json({
        env,
        envDetail: envRaw,
        platformReady,
        platformFallback: envRaw.platformFallback,
        ...planAi,
        aiConfig: {
          id: null,
          isActive: platformReady,
          provider: defaultProvider,
          model: defaultModel,
          apiKey: '',
          temperature: 0.75,
          systemPrompt: '',
          autoSuggest: true,
          autoReply: platformReady,
        },
      })
    }

    const maskedKey = aiConfig.apiKey
      ? aiConfig.apiKey.substring(0, 8) + '...' + aiConfig.apiKey.substring(aiConfig.apiKey.length - 4)
      : ''

    return NextResponse.json({
      env,
      envDetail: envRaw,
      platformReady,
      platformFallback: envRaw.platformFallback,
      ...planAi,
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

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true, ownerId: true, members: { where: { userId: session.user.id } } },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const isOwner = website.ownerId === session.user.id
    const isMember = website.members.length > 0
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
    }

    const plan = website.plan as PlanType

    const enablingAi = isActive === true || autoReply === true || autoSuggest === true
    if (enablingAi) {
      const hasAi = await websiteHasAiAssistant(website.id, plan)
      if (!hasAi) {
        const denied = await planFeatureDeniedAsync(website.id, plan, 'aiAssistant')
        if (denied) return denied
      }
    }

    const data: Record<string, unknown> = {}
    if (isActive !== undefined) data.isActive = isActive
    if (temperature !== undefined) data.temperature = temperature
    if (systemPrompt !== undefined) data.systemPrompt = systemPrompt
    if (autoSuggest !== undefined) data.autoSuggest = autoSuggest
    if (autoReply !== undefined) data.autoReply = autoReply
    if (apiKey && !apiKey.includes('...')) data.apiKey = apiKey

    const requestedProvider = (provider as AiProvider | undefined) ?? getDefaultProviderForPlan(plan)
    const requestedModel = (model as string | undefined) ?? getDefaultModelForPlan(plan, requestedProvider)

    if (!isProviderAllowedForPlan(plan, requestedProvider)) {
      return NextResponse.json(
        { error: 'Bu sağlayıcı mevcut paketinizde kullanılamaz. Paketinizi yükseltin.' },
        { status: 403 }
      )
    }
    if (!isModelAllowedForPlan(plan, requestedProvider, requestedModel)) {
      return NextResponse.json(
        { error: 'Bu model mevcut paketinizde kullanılamaz. Paketinizi yükseltin.' },
        { status: 403 }
      )
    }

    const clamped = clampModelToPlan(plan, requestedProvider, requestedModel)
    data.provider = clamped.provider
    data.model = clamped.model

    const aiConfig = await prisma.aIConfig.upsert({
      where: { websiteId: website.id },
      update: data,
      create: {
        websiteId: website.id,
        isActive: isActive ?? false,
        provider: clamped.provider,
        model: clamped.model,
        apiKey: (apiKey as string) || '',
        temperature: temperature ?? 0.7,
        systemPrompt: systemPrompt ?? '',
        autoSuggest: autoSuggest ?? true,
        autoReply: autoReply ?? false,
      },
    })

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
