import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { websiteHasFeature } from '@/lib/addon-features'
import { isPlatformAdminRole } from '@/lib/admin-website'
import { PLAN_LIMITS } from '@/lib/constants'
import type { PlanFeature } from '@/lib/plan-shared'

const ALL_FEATURES = Object.keys(PLAN_LIMITS.FREE) as PlanFeature[]

export async function GET(
  req: Request,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { websiteId } = await params

  const website = await prisma.website.findFirst({
    where: {
      AND: [
        { OR: [{ id: websiteId }, { websiteId }] },
        {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      ],
    },
    select: { id: true, websiteId: true, plan: true },
  })

  if (!website) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }

  const features: Partial<Record<PlanFeature, boolean>> = {}

  if (isPlatformAdminRole(session.user.role)) {
    for (const feature of ALL_FEATURES) features[feature] = true
  } else {
    await Promise.all(
      ALL_FEATURES.map(async (feature) => {
        features[feature] = await websiteHasFeature(website.id, website.plan, feature)
      })
    )
  }

  return NextResponse.json({
    websiteId: website.websiteId,
    plan: website.plan,
    features,
  })
}
