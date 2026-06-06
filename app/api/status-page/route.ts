import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')
  const subdomain = searchParams.get('subdomain')

  if (subdomain) {
    const page = await prisma.statusPage.findUnique({
      where: { subdomain },
      include: {
        components: { orderBy: { order: 'asc' } },
        incidents: {
          include: { updates: { orderBy: { createdAt: 'desc' } } },
          orderBy: { startedAt: 'desc' },
          take: 50,
        },
      },
    })
    if (!page) {
      return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({
      page: {
        title: page.title,
        description: page.description,
        logoUrl: page.logoUrl,
        primaryColor: page.primaryColor,
        twitterHandle: page.twitterHandle,
        showHistory: page.showHistory,
        isActive: page.isActive,
      },
      components: page.components,
      incidents: page.incidents,
    })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  if (!websiteId) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteId)
  if (!website) {
    return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'statusPage')
  if (planDenied) return planDenied

  const page = await prisma.statusPage.findUnique({
    where: { websiteId: website.id },
    include: {
      components: { orderBy: { order: 'asc' } },
      incidents: {
        include: { updates: { orderBy: { createdAt: 'desc' } } },
        orderBy: { startedAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!page) {
    return NextResponse.json({ page: null, components: [], incidents: [] })
  }

  return NextResponse.json({ page, components: page.components, incidents: page.incidents })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { websiteId, title, description, subdomain, logoUrl, primaryColor, twitterHandle, isActive, isPublic, showHistory } = body

    if (!websiteId || !subdomain) {
      return NextResponse.json({ error: 'websiteId ve subdomain gerekli' }, { status: 400 })
    }

    const website = await resolveWebsite(websiteId)
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id },
    })
    if (!member) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'statusPage')
    if (planDenied) return planDenied

    const existing = await prisma.statusPage.findUnique({ where: { subdomain } })
    if (existing && existing.websiteId !== website.id) {
      return NextResponse.json({ error: 'Bu alt alan adı zaten kullanılıyor' }, { status: 409 })
    }

    const page = await prisma.statusPage.upsert({
      where: { websiteId: website.id },
      create: {
        websiteId: website.id,
        title: title || 'Service Status',
        description,
        subdomain,
        logoUrl,
        primaryColor: primaryColor || '#1972F5',
        twitterHandle,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
        showHistory: showHistory ?? true,
      },
      update: {
        title: title || 'Service Status',
        description,
        subdomain,
        logoUrl,
        primaryColor: primaryColor || '#1972F5',
        twitterHandle,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
        showHistory: showHistory ?? true,
      },
    })

    return NextResponse.json(page, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Durum sayfası oluşturulamadı' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, websiteId, subdomain } = body

    if (!id && !websiteId) {
      return NextResponse.json({ error: 'id veya websiteId gerekli' }, { status: 400 })
    }

    const resolvedWebsiteId = websiteId
      ? (await resolveWebsite(websiteId))?.id
      : undefined

    let statusPage = id
      ? await prisma.statusPage.findUnique({ where: { id } })
      : resolvedWebsiteId
      ? await prisma.statusPage.findUnique({ where: { websiteId: resolvedWebsiteId } })
      : null

    if (!statusPage) {
      return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })
    }

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: statusPage.websiteId, userId: session.user.id },
    })
    if (!member) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    if (subdomain) {
      const dup = await prisma.statusPage.findUnique({ where: { subdomain } })
      if (dup && dup.id !== statusPage.id) {
        return NextResponse.json({ error: 'Bu alt alan adı zaten kullanılıyor' }, { status: 409 })
      }
    }

    const updated = await prisma.statusPage.update({
      where: { id: statusPage.id },
      data: {
        title: body.title,
        description: body.description,
        subdomain: body.subdomain,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        twitterHandle: body.twitterHandle,
        isActive: body.isActive,
        isPublic: body.isPublic,
        showHistory: body.showHistory,
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Durum sayfası güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const websiteId = searchParams.get('websiteId')

    if (!id && !websiteId) {
      return NextResponse.json({ error: 'id veya websiteId gerekli' }, { status: 400 })
    }

    const statusPageWhere = id ? { id } : websiteId ? { websiteId } : null
    if (!statusPageWhere) {
      return NextResponse.json({ error: 'id veya websiteId gerekli' }, { status: 400 })
    }
    let statusPage = await prisma.statusPage.findUnique({ where: statusPageWhere })

    if (!statusPage) {
      return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })
    }

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: statusPage.websiteId, userId: session.user.id },
    })
    if (!member) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    await prisma.statusPage.delete({ where: { id: statusPage.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Durum sayfası silinemedi' }, { status: 500 })
  }
}
