import { auth } from './auth'
import { prisma } from './db'
import { websiteHasFeature } from './addon-features'
import { PLAN_LIMITS, PlanType } from './constants'
import { Plan, TeamRole } from '../app/generated/prisma/client'
import { NextRequest } from 'next/server'

// ─── Type Guard ──────────────────────────────────────────────────────

/**
 * Type guard to check if requireWebsiteAccess returned a successful result
 * or an error Response.
 *
 * Usage:
 * ```ts
 * const access = await requireWebsiteAccess(request)
 * if (isErrorResponse(access)) return access
 * // access is now WebsiteAccessResult
 * const { website, membership } = access
 * ```
 */
export function isErrorResponse(result: WebsiteAccessResult | Response): result is Response {
  return result instanceof Response
}

// ─── Types ──────────────────────────────────────────────────────────

export interface WebsiteAccessResult {
  session: NonNullable<Awaited<ReturnType<typeof auth>>> & {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
    }
  }
  website: {
    id: string
    websiteId: string
    name: string
    domain: string
    plan: Plan
    subscriptionStatus: string
    primaryColor: string | null
    position: string | null
    welcomeMessage: string | null
    offlineMessage: string | null
    avatarUrl: string | null
  }
  membership: {
    id: string
    role: TeamRole
    userId: string
    websiteId: string
  }
}

export type AccessLevel = 'anyMember' | 'adminOnly' | 'ownerOnly'

export interface PlanFeatureCheck {
  feature: keyof (typeof PLAN_LIMITS)[PlanType]
  currentCount?: number
}

// ─── Error Responses ────────────────────────────────────────────────

export function unauthorizedError(message = 'Yetkilendirme gerekli') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function forbiddenError(message = 'Bu işlem için yetkiniz yok') {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function planLimitError(feature: string, upgradeUrl = '/settings/billing') {
  return new Response(
    JSON.stringify({
      error: `Bu özellik mevcut planınızda bulunmuyor. Yükseltme için: ${upgradeUrl}`,
      upgradeRequired: true,
      feature,
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

export function notFoundError(resource = 'Kaynak bulunamadı') {
  return new Response(JSON.stringify({ error: resource }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function serverError(message = 'Sunucu hatası') {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Extract websiteId from request ─────────────────────────────────

export async function extractWebsiteId(request: NextRequest): Promise<string | null> {
  // 1. Try query parameter
  const url = new URL(request.url)
  const websiteIdFromQuery = url.searchParams.get('websiteId')
  if (websiteIdFromQuery) return websiteIdFromQuery

  // 2. Try request body (for POST/PATCH/PUT)
  if (request.method !== 'GET' && request.method !== 'DELETE') {
    try {
      const body = await request.json()
      if (body.websiteId) return body.websiteId
    } catch {
      // Body may not be JSON or may be empty
    }
  }

  return null
}

// ─── Main Access Control Function ────────────────────────────────────

/**
 * Central tenant isolation and plan enforcement middleware.
 *
 * Usage in API routes:
 *
 * ```ts
 * const access = await requireWebsiteAccess(request, {
 *   accessLevel: 'adminOnly',
 * })
 * if (access instanceof Response) return access // Return error response
 *
 * // access.session, access.website, access.membership are now available
 * const conversations = await prisma.conversation.findMany({
 *   where: { websiteId: access.website.websiteId },
 * })
 * ```
 */
export async function requireWebsiteAccess(
  request: NextRequest,
  options: {
    accessLevel?: AccessLevel
    planFeature?: PlanFeatureCheck
    allowAdmin?: boolean // Super admin can bypass membership check
  } = {}
): Promise<WebsiteAccessResult | Response> {
  const { accessLevel = 'anyMember', planFeature, allowAdmin = true } = options

  // 1. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return unauthorizedError()
  }

  // 2. Extract websiteId
  const websiteId = await extractWebsiteId(request)
  if (!websiteId) {
    return new Response(
      JSON.stringify({ error: 'websiteId parametresi gerekli' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 3. Look up website
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      id: true,
      websiteId: true,
      name: true,
      domain: true,
      plan: true,
      subscriptionStatus: true,
      primaryColor: true,
      position: true,
      welcomeMessage: true,
      offlineMessage: true,
      avatarUrl: true,
    },
  })

  if (!website) {
    return notFoundError('Site bulunamadı')
  }

  // 4. Super admin bypass
  if (allowAdmin && session.user.role === 'ADMIN') {
    // Admin has full access, create a synthetic membership
    const membership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id, websiteId: website.id },
    })

    return {
      session: session as unknown as WebsiteAccessResult['session'],
      website,
      membership: membership || {
        id: 'admin-bypass',
        role: 'OWNER' as TeamRole,
        userId: session.user.id,
        websiteId: website.id,
      },
    }
  }

  // 5. Check membership and role
  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, websiteId: website.id },
  })

  if (!membership) {
    return forbiddenError('Bu siteye erişim yetkiniz yok')
  }

  // 6. Role-based access check
  if (accessLevel === 'ownerOnly' && membership.role !== 'OWNER') {
    return forbiddenError('Bu işlem sadece site sahibi tarafından yapılabilir')
  }

  if (accessLevel === 'adminOnly' && !['OWNER', 'ADMIN'].includes(membership.role)) {
    return forbiddenError('Bu işlem için yönetici yetkisi gerekli')
  }

  // 7. Plan feature check
  if (planFeature) {
    const allowed = await websiteHasFeature(
      website.id,
      website.plan,
      planFeature.feature,
      planFeature.currentCount
    )
    if (!allowed) {
      return planLimitError(planFeature.feature as string)
    }
  }

  return {
    session: session as unknown as WebsiteAccessResult['session'],
    website,
    membership,
  }
}

// ─── Helper: Get all websites for a user ─────────────────────────────

export async function getUserWebsites(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      website: {
        select: {
          id: true,
          websiteId: true,
          name: true,
          domain: true,
          plan: true,
          subscriptionStatus: true,
          primaryColor: true,
          position: true,
          welcomeMessage: true,
          offlineMessage: true,
          avatarUrl: true,
          showPreChatForm: true,
          requireName: true,
          requireEmail: true,
        },
      },
    },
  })

  return memberships.map((m) => ({
    ...(m.website as Record<string, unknown>),
    role: m.role,
  }))
}

// ─── Helper: Get active website for user ─────────────────────────────

export async function getActiveWebsite(userId: string, activeWebsiteId?: string | null) {
  // If user has an active website preference, use it
  if (activeWebsiteId) {
    const membership = await prisma.teamMember.findFirst({
      where: { userId, website: { websiteId: activeWebsiteId } },
      include: {
        website: {
          select: {
            id: true,
            websiteId: true,
            name: true,
            domain: true,
            plan: true,
            subscriptionStatus: true,
            primaryColor: true,
            position: true,
            welcomeMessage: true,
            offlineMessage: true,
            avatarUrl: true,
            showPreChatForm: true,
            requireName: true,
            requireEmail: true,
          },
        },
      },
    })

    if (membership) {
      return { ...membership.website, role: membership.role }
    }
  }

  // Fallback: return the first website the user has access to
  const websites = await getUserWebsites(userId)
  return websites[0] || null
}