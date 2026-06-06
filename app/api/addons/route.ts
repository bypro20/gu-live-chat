import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAddonMeta } from '@/lib/addon-catalog'
import { ADDON_FEATURE_MAP } from '@/lib/addon-features'
import { MIN_PLAN_FOR_FEATURE } from '@/lib/plan-gate'
import { canPerformAction } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const websiteId = searchParams.get('websiteId')

    const addons = await prisma.addon.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    })

    let purchases: { addonId: string; isActive: boolean; config: string | null; expiresAt: Date | null; cancelledAt: Date | null }[] = []
    let plan: string | null = null

    if (websiteId) {
      const website = await prisma.website.findUnique({
        where: { websiteId },
        select: {
          id: true,
          plan: true,
          ownerId: true,
          members: { where: { userId: session.user.id } },
        },
      })

      if (website) {
        plan = website.plan
        const isOwner = website.ownerId === session.user.id
        const isMember = website.members.length > 0
        if (isOwner || isMember) {
          purchases = await prisma.addonPurchase.findMany({
            where: { websiteId: website.id },
            select: { addonId: true, isActive: true, config: true, expiresAt: true, cancelledAt: true },
          })
        }
      }
    }

    const enrichedAddons = addons.map((addon) => {
      const meta = getAddonMeta(addon.slug)
      const feature = ADDON_FEATURE_MAP[addon.slug] || meta.feature
      const requiredPlan = feature ? MIN_PLAN_FOR_FEATURE[feature] : meta.requiredPlan
      const includedInPlan = plan && feature ? canPerformAction(plan as never, feature) : false
      return {
        ...addon,
        featureKey: feature || null,
        requiredPlan: requiredPlan || null,
        includedInPlan,
      }
    })

    return NextResponse.json({ addons: enrichedAddons, purchases, plan })
  } catch (error) {
    console.error('[Addons GET] Error:', error)
    return NextResponse.json({ error: 'Eklentiler alınamadı' }, { status: 500 })
  }
}
