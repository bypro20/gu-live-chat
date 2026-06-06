import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'
import { isTranslationAvailable } from '@/lib/ai/translate'
import { PLAN_LIMITS } from '@/lib/constants'
import type { DbAiConfig } from '@/lib/ai/provider'

const widgetInitSchema = z.object({
  websiteId: z.string(),
  fingerprint: z.string(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional().or(z.literal('')),
  currentPage: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
})

// ─── User-Agent Parsing ─────────────────────────────────────────────
function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  if (!ua) return { browser, os, device }

  // Device detection
  if (/iPhone/i.test(ua)) { device = 'Mobile'; os = 'iOS' }
  else if (/iPad/i.test(ua)) { device = 'Tablet'; os = 'iPadOS' }
  else if (/Android/i.test(ua)) {
    device = /Mobile/i.test(ua) ? 'Mobile' : 'Tablet'
    os = 'Android'
  }
  else if (/Mac/i.test(ua)) os = 'macOS'
  else if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/CrOS/i.test(ua)) os = 'Chrome OS'

  // Browser detection (order matters — more specific first)
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Chrome/i.test(ua)) browser = 'Chrome'

  return { browser, os, device }
}

// ─── Extract page title from URL ─────────────────────────────────────
function extractPageTitle(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    // Convert /path/to/page → "Path To Page"
    if (path && path !== '/') {
      return path
        .split('/')
        .filter(Boolean)
        .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1).replace(/[-_]/g, ' '))
        .join(' → ')
    }
  } catch { /* ignore */ }
  return null
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req)
    if (await isIpBanned(clientIp)) {
      return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
    }

    const body = await req.json()
    const validated = widgetInitSchema.parse(body)

    // Find website
    const website = await prisma.website.findUnique({
      where: { websiteId: validated.websiteId },
    })

    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    // Parse user-agent
    const ua = parseUserAgent(validated.userAgent || '')

    // Find or create visitor
    let visitor = await prisma.visitor.findUnique({
      where: {
        websiteId_fingerprint: {
          websiteId: website.id,
          fingerprint: validated.fingerprint,
        },
      },
    })

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          websiteId: website.id,
          fingerprint: validated.fingerprint,
          name: validated.visitorName || null,
          email: validated.visitorEmail || null,
          browser: ua.browser,
          os: ua.os,
          device: ua.device,
        },
      })
    } else {
      // Update visitor info (always update UA, only update name/email if provided)
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          ...(validated.visitorName ? { name: validated.visitorName } : {}),
          ...(validated.visitorEmail ? { email: validated.visitorEmail } : {}),
          browser: ua.browser,
          os: ua.os,
          device: ua.device,
          // Keep existing country/city if we don't have new data
        },
      })
    }

    // Create visitor session
    const session = await prisma.visitorSession.create({
      data: {
        visitorId: visitor.id,
        websiteId: website.id,
        sessionId: crypto.randomUUID(),
        landingPage: validated.currentPage || null,
        currentPage: validated.currentPage || null,
        currentTitle: extractPageTitle(validated.currentPage ?? null) ?? null,
        referrer: validated.referrer ?? null,
        userAgent: validated.userAgent ?? null,
        // country and city will be populated later via IP geolocation
      },
    })

    // Check for open conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        visitorId: visitor.id,
        websiteId: website.id,
        status: { in: ['OPEN', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Generate visitor token — use public websiteId for socket room consistency
    const visitorToken = Buffer.from(
      JSON.stringify({ visitorId: visitor.id, websiteId: website.websiteId, sessionId: session.sessionId })
    ).toString('base64')

    // Resolve plan limits for this website
    const planLimits = PLAN_LIMITS[website.plan]
    const fileUpload = planLimits.fileUpload

    // Determine whether live message translation can be offered. Checks the
    // plan limit first, then verifies an AI/Google key is actually configured.
    // Never throws — translation simply stays disabled when unavailable.
    let aiTranslate = false
    if (planLimits.autoTranslate) {
      try {
        const aiCfg = await prisma.aIConfig.findUnique({
          where: { websiteId: website.id },
          select: { provider: true, model: true, apiKey: true, temperature: true },
        })
        const dbConfig: DbAiConfig | null = aiCfg
          ? {
              provider: aiCfg.provider as DbAiConfig['provider'],
              model: aiCfg.model ?? null,
              apiKey: aiCfg.apiKey ?? null,
              temperature: aiCfg.temperature ?? null,
            }
          : null
        aiTranslate = isTranslationAvailable(dbConfig)
      } catch {
        aiTranslate = false
      }
    }

    return NextResponse.json({
      visitorToken,
      visitorId: visitor.id,
      sessionId: session.id,
      conversationId: existingConversation?.id || null,
      features: {
        fileUpload,
        aiTranslate,
      },
      websiteConfig: {
        primaryColor: website.primaryColor,
        position: website.position,
        welcomeMessage: website.welcomeMessage,
        offlineMessage: website.offlineMessage,
        avatarUrl: website.avatarUrl,
        websiteName: website.name,
        agentsOnline: 0, // Will be updated via Socket.io
      },
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz veri' },
        { status: 400 }
      )
    }
    console.error('Widget init error:', error)
    return NextResponse.json({ error: 'Başlatma başarısız' }, { status: 500 })
  }
}