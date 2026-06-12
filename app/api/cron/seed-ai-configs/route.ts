import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hasAnyPlatformAiKey } from '@/lib/ai/provider'
import { ensureAiConfig } from '@/lib/ai/ensure-config'
import { websiteHasAiAssistant } from '@/lib/plan-features'
import { isAdminOwnedWebsite } from '@/lib/admin-website'
import type { PlanType } from '@/lib/constants'

function authorizeCron(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET
  const provided = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/** GET /api/cron/seed-ai-configs — AI yapılandırması olmayan uygun sitelere varsayılan config ekler */
export async function GET(request: NextRequest) {
  const denied = authorizeCron(request)
  if (denied) return denied

  if (!hasAnyPlatformAiKey()) {
    return NextResponse.json({ error: 'Platform AI anahtarı yok' }, { status: 503 })
  }

  try {
    const websites = await prisma.website.findMany({
      select: { id: true, websiteId: true, name: true, plan: true },
    })

    const results: Array<{ websiteId: string; name: string; status: string }> = []

    for (const site of websites) {
      const plan = site.plan as PlanType
      const admin = await isAdminOwnedWebsite(site.id)
      const hasAi = admin || (await websiteHasAiAssistant(site.id, plan))
      if (!hasAi) {
        results.push({ websiteId: site.websiteId, name: site.name, status: 'skipped_no_ai' })
        continue
      }

      const before = await prisma.aIConfig.findUnique({ where: { websiteId: site.id } })
      const cfg = await ensureAiConfig(site.id)
      results.push({
        websiteId: site.websiteId,
        name: site.name,
        status: before ? 'exists' : cfg ? 'created' : 'failed',
      })
    }

    return NextResponse.json({ ok: true, count: results.length, results })
  } catch (error) {
    console.error('[cron/seed-ai-configs]', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
