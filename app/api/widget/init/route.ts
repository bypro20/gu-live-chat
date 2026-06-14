import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'
import { isTranslationAvailable } from '@/lib/ai/translate'
import { PLAN_LIMITS } from '@/lib/constants'
import { websiteHasAutoTranslate } from '@/lib/plan-features'
import { resolveAgentsOnline } from '@/lib/agents-online'
import { findWebsiteForWidget } from '@/lib/website-widget-safe'
import { extendTrialForActivation } from '@/lib/trial'
import { visitorHasRequiredIdentity, widgetIdentityRequired } from '@/lib/widget-identity'
import { withWidgetIdentityDefaults } from '@/lib/widget-platform-defaults'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'
import { isValidCustomerEmbedUrl, normalizeExternalUrl } from '@/lib/widget-embed-url'
import { buildVisitorGeoUpdate, buildVisitorSessionMetadata } from '@/lib/visitor-session-enrich'

const widgetInitSchema = z.object({
  websiteId: z.string(),
  fingerprint: z.string(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional().or(z.literal('')),
  currentPage: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
})

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
    const limited = rateLimitByIp(req, 'widget-init', 60, 60_000)
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

    const clientIp = getClientIp(req)
    if (await isIpBanned(clientIp)) {
      return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
    }

    const body = await req.json()
    const validated = widgetInitSchema.parse(body)

    const website = await findWebsiteForWidget(validated.websiteId)
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    const sessionMetadata = await buildVisitorSessionMetadata({
      userAgent: validated.userAgent,
      clientIp,
    })
    const visitorProfileUpdate = buildVisitorGeoUpdate(sessionMetadata)

    let isNewVisitor = false

    let visitor: { id: string; name: string | null; email: string | null } | null = null
    try {
      visitor = await prisma.visitor.findUnique({
        where: {
          websiteId_fingerprint: {
            websiteId: website.id,
            fingerprint: validated.fingerprint,
          },
        },
        select: { id: true, name: true, email: true },
      })
    } catch (visitorLookupErr) {
      console.warn('[widget/init] visitor lookup failed:', visitorLookupErr)
      try {
        const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string | null; email: string | null }>>(
          `SELECT id, name, email FROM visitors WHERE websiteId = ? AND fingerprint = ? LIMIT 1`,
          website.id,
          validated.fingerprint
        )
        visitor = rows[0] ?? null
      } catch {
        visitor = null
      }
    }

    if (!visitor) {
      isNewVisitor = true
      try {
        visitor = await prisma.visitor.create({
          data: {
            websiteId: website.id,
            fingerprint: validated.fingerprint,
            name: validated.visitorName || null,
            email: validated.visitorEmail || null,
            ...visitorProfileUpdate,
          },
        })
      } catch {
        visitor = await prisma.visitor.create({
          data: {
            websiteId: website.id,
            fingerprint: validated.fingerprint,
            name: validated.visitorName || null,
            email: validated.visitorEmail || null,
            browser: sessionMetadata.browser,
            os: sessionMetadata.os,
            device: sessionMetadata.device,
          },
        })
      }
    } else {
      try {
        visitor = await prisma.visitor.update({
          where: { id: visitor.id },
          data: {
            ...(validated.visitorName ? { name: validated.visitorName } : {}),
            ...(validated.visitorEmail ? { email: validated.visitorEmail } : {}),
            ...visitorProfileUpdate,
          },
        })
      } catch {
        visitor = await prisma.visitor.update({
          where: { id: visitor.id },
          data: {
            ...(validated.visitorName ? { name: validated.visitorName } : {}),
            ...(validated.visitorEmail ? { email: validated.visitorEmail } : {}),
            browser: sessionMetadata.browser,
            os: sessionMetadata.os,
            device: sessionMetadata.device,
          },
        })
      }
    }

    const embedPage =
      validated.currentPage && isValidCustomerEmbedUrl(validated.currentPage)
        ? normalizeExternalUrl(validated.currentPage)
        : null

    let session: { sessionId: string }
    try {
      session = await prisma.visitorSession.create({
        data: {
          visitorId: visitor.id,
          websiteId: website.id,
          sessionId: crypto.randomUUID(),
          landingPage: embedPage,
          currentPage: embedPage,
          currentTitle: extractPageTitle(embedPage) ?? null,
          referrer: validated.referrer?.trim() || null,
          ...sessionMetadata,
        },
        select: { sessionId: true },
      })
    } catch (sessionErr) {
      console.warn('[widget/init] visitorSession create failed, minimal:', sessionErr)
      session = await prisma.visitorSession.create({
        data: {
          visitorId: visitor.id,
          websiteId: website.id,
          sessionId: crypto.randomUUID(),
        },
        select: { sessionId: true },
      })
    }

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
    let translateAllowed = false
    try {
      translateAllowed = await websiteHasAutoTranslate(website.id, website.plan)
    } catch (translateErr) {
      console.warn('[widget/init] translate check skipped:', translateErr)
    }
    aiTranslate = translateAllowed && isTranslationAvailable(null)

    const agentsOnline = await resolveAgentsOnline(website.websiteId, website.id)

    const identityPolicy = withWidgetIdentityDefaults(website)

    void extendTrialForActivation(website.websiteId, 'widget').catch((err) => {
      console.warn('[widget/init] trial widget bonus skipped:', err)
    })

    if (isNewVisitor) {
      try {
        const { runWorkflows } = await import('@/lib/workflow-runner')
        await runWorkflows('VISITOR_CREATED', {
          websiteDbId: website.id,
          websitePublicId: website.websiteId,
          visitorId: visitor.id,
        })
      } catch (wfErr) {
        console.warn('[widget/init] workflow skipped:', wfErr)
      }
    }

    return NextResponse.json({
      visitorToken,
      visitorId: visitor.id,
      sessionId: session.sessionId,
      conversationId: existingConversation?.id || null,
      visitorProfile: {
        name: visitor.name,
        email: visitor.email,
      },
      identityRequired: widgetIdentityRequired(identityPolicy),
      identityComplete: visitorHasRequiredIdentity(identityPolicy, visitor),
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
        agentsOnline,
        showPreChatForm: identityPolicy.showPreChatForm,
        requireName: identityPolicy.requireName,
        requireEmail: identityPolicy.requireEmail,
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