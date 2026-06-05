import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    if (websiteId) {
      const website = await prisma.website.findUnique({
        where: { websiteId },
        select: { id: true, ownerId: true, members: { where: { userId: session.user.id } } },
      })

      if (website) {
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

    return NextResponse.json({ addons, purchases })
  } catch (error) {
    console.error('[Addons GET] Error:', error)
    return NextResponse.json({ error: 'Eklentiler alınamadı' }, { status: 500 })
  }
}
