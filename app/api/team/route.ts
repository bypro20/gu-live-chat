import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteIdParam = searchParams.get('websiteId')

  if (!websiteIdParam) {
    return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteIdParam)
  if (!website) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }

  // Verify membership
  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })

  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const team = await prisma.teamMember.findMany({
    where: { websiteId: website.id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { role: 'asc' },
  })

  return NextResponse.json(team)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { websiteId: websiteIdParam, email, role } = body

    if (!websiteIdParam || !email || !role) {
      return NextResponse.json({ error: 'Tüm alanlar gerekli' }, { status: 400 })
    }

    const website = await resolveWebsite(websiteIdParam)
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    // Check inviter permission
    const inviter = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })

    if (!inviter) {
      return NextResponse.json({ error: 'Davet yetkiniz yok' }, { status: 403 })
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!invitedUser) {
      return NextResponse.json({ error: 'Bu e-posta adresiyle kullanıcı bulunamadı' }, { status: 404 })
    }

    // Check if already member
    const existing = await prisma.teamMember.findUnique({
      where: { userId_websiteId: { userId: invitedUser.id, websiteId: website.id } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Bu kullanıcı zaten takımda' }, { status: 409 })
    }

    // Check plan limits
    const memberCount = await prisma.teamMember.count({ where: { websiteId: website.id } })
    const { PLAN_LIMITS } = await import('@/lib/constants')
    const limits = PLAN_LIMITS[website.plan as keyof typeof PLAN_LIMITS]
    if (memberCount >= limits.maxAgents) {
      return NextResponse.json({ error: 'Planınızın temsilci limitine ulaştınız' }, { status: 403 })
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: invitedUser.id,
        websiteId: website.id,
        role,
        invitedBy: session.user.id,
        invitedAt: new Date(),
        acceptedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    return NextResponse.json(teamMember, { status: 201 })
  } catch (error) {
    console.error('Invite team member error:', error)
    return NextResponse.json({ error: 'Davet gönderilemedi' }, { status: 500 })
  }
}