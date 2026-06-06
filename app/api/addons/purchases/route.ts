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

    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Erişim izniniz yok' }, { status: 403 })
    }

    const purchases = await prisma.addonPurchase.findMany({
      where: { websiteId: website.id },
      include: { addon: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('[Addon Purchases GET] Error:', error)
    return NextResponse.json({ error: 'Satın alımlar alınamadı' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const body = await req.json()
    const { websiteId, addonId, action } = body

    if (!websiteId || !addonId || !action) {
      return NextResponse.json({ error: 'websiteId, addonId ve action gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, ownerId: true },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    if (website.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Bu işlem için site sahibi olmalısınız' }, { status: 403 })
    }

    const addon = await prisma.addon.findUnique({
      where: { id: addonId },
    })

    if (!addon) {
      return NextResponse.json({ error: 'Eklenti bulunamadı' }, { status: 404 })
    }

    switch (action) {
      case 'purchase': {
        const existing = await prisma.addonPurchase.findUnique({
          where: { websiteId_addonId: { websiteId: website.id, addonId } },
        })

        if (existing) {
          return NextResponse.json({ error: 'Bu eklenti zaten satın alınmış' }, { status: 409 })
        }

        if (addon.price > 0) {
          return NextResponse.json(
            {
              error: 'Ücretli eklentiler için ödeme gerekli',
              paymentRequired: true,
              addonSlug: addon.slug,
              price: addon.price,
            },
            { status: 402 }
          )
        }

        const expiresAt = addon.purchaseType === 'MONTHLY'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : addon.purchaseType === 'YEARLY'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : null

        const purchase = await prisma.addonPurchase.create({
          data: {
            websiteId: website.id,
            addonId,
            isActive: true,
            autoRenew: true,
            expiresAt,
          },
        })

        return NextResponse.json({ purchase, message: 'Eklenti başarıyla satın alındı' })
      }

      case 'cancel': {
        const purchase = await prisma.addonPurchase.findUnique({
          where: { websiteId_addonId: { websiteId: website.id, addonId } },
        })

        if (!purchase) {
          return NextResponse.json({ error: 'Satın alım bulunamadı' }, { status: 404 })
        }

        const updated = await prisma.addonPurchase.update({
          where: { id: purchase.id },
          data: {
            autoRenew: false,
            cancelledAt: new Date(),
            isActive: false,
          },
        })

        return NextResponse.json({ purchase: updated, message: 'Abonelik iptal edildi' })
      }

      case 'toggle': {
        const purchase = await prisma.addonPurchase.findUnique({
          where: { websiteId_addonId: { websiteId: website.id, addonId } },
        })

        if (!purchase) {
          return NextResponse.json({ error: 'Satın alım bulunamadı' }, { status: 404 })
        }

        const updated = await prisma.addonPurchase.update({
          where: { id: purchase.id },
          data: { isActive: !purchase.isActive },
        })

        return NextResponse.json({ purchase: updated, message: updated.isActive ? 'Eklenti aktifleştirildi' : 'Eklenti devre dışı bırakıldı' })
      }

      case 'config': {
        const { config } = body
        if (!config) {
          return NextResponse.json({ error: 'config gerekli' }, { status: 400 })
        }

        const purchase = await prisma.addonPurchase.findUnique({
          where: { websiteId_addonId: { websiteId: website.id, addonId } },
        })

        if (!purchase) {
          return NextResponse.json({ error: 'Satın alım bulunamadı' }, { status: 404 })
        }

        const updated = await prisma.addonPurchase.update({
          where: { id: purchase.id },
          data: { config: typeof config === 'string' ? config : JSON.stringify(config) },
        })

        return NextResponse.json({ purchase: updated, message: 'Yapılandırma kaydedildi' })
      }

      default:
        return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Addon Purchases POST] Error:', error)
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 })
  }
}
