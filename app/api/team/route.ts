import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')

  if (!websiteId) {
    return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })
  }

  // Verify membership
  const member = await prisma.teamMember.findFirst({
    where: { websiteId, userId: session.user.id },
  })

  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const team = await prisma.teamMember.findMany({
    where: { websiteId },
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
    const { websiteId, email, role } = body

    if (!websiteId || !email || !role) {
      return NextResponse.json({ error: 'Tüm alanlar gerekli' }, { status: 400 })
    }

    // Check inviter permission
    const inviter = await prisma.teamMember.findFirst({
      where: { websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
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
      where: { userId_websiteId: { userId: invitedUser.id, websiteId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Bu kullanıcı zaten takımda' }, { status: 409 })
    }

    // Check plan limits
    const website = await prisma.website.findUnique({ where: { id: websiteId } })
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    const memberCount = await prisma.teamMember.count({ where: { websiteId } })
    const { PLAN_LIMITS } = await import('@/lib/constants')
    const limits = PLAN_LIMITS[website.plan as keyof typeof PLAN_LIMITS]
    if (memberCount >= limits.maxAgents) {
      return NextResponse.json({ error: 'Planınızın temsilci limitine ulaştınız' }, { status: 403 })
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: invitedUser.id,
        websiteId,
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