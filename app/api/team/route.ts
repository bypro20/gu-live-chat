import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { sendEmail, teamInviteEmail } from '@/lib/email'
import { buildTeamInviteUrl, teamInviteExpiry } from '@/lib/team-invite'

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

  const pendingInvites = await prisma.teamInvite.findMany({
    where: { websiteId: website.id, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, email: true, role: true, invitedAt: true, expiresAt: true },
    orderBy: { invitedAt: 'desc' },
  })

  return NextResponse.json({ team, pendingInvites })
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

    const normalizedEmail = String(email).trim().toLowerCase()

    const website = await resolveWebsite(websiteIdParam)
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    const inviter = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
      include: { user: { select: { name: true, email: true } } },
    })

    if (!inviter) {
      return NextResponse.json({ error: 'Davet yetkiniz yok' }, { status: 403 })
    }

    const memberCount = await prisma.teamMember.count({ where: { websiteId: website.id } })
    const pendingCount = await prisma.teamInvite.count({
      where: { websiteId: website.id, acceptedAt: null, expiresAt: { gt: new Date() } },
    })
    const { PLAN_LIMITS } = await import('@/lib/constants')
    const limits = PLAN_LIMITS[website.plan as keyof typeof PLAN_LIMITS]
    if (memberCount + pendingCount >= limits.maxAgents) {
      return NextResponse.json({ error: 'Planınızın temsilci limitine ulaştınız' }, { status: 403 })
    }

    const invitedUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    const inviterName = inviter.user.name || inviter.user.email || 'Bir takım üyesi'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!invitedUser) {
      const existingInvite = await prisma.teamInvite.findUnique({
        where: { email_websiteId: { email: normalizedEmail, websiteId: website.id } },
      })

      if (existingInvite && !existingInvite.acceptedAt && existingInvite.expiresAt > new Date()) {
        return NextResponse.json({ error: 'Bu e-posta adresine zaten davet gönderildi' }, { status: 409 })
      }

      const invite = await prisma.teamInvite.upsert({
        where: { email_websiteId: { email: normalizedEmail, websiteId: website.id } },
        create: {
          email: normalizedEmail,
          role,
          websiteId: website.id,
          invitedBy: session.user.id,
          expiresAt: teamInviteExpiry(),
        },
        update: {
          role,
          invitedBy: session.user.id,
          invitedAt: new Date(),
          expiresAt: teamInviteExpiry(),
          acceptedAt: null,
          token: crypto.randomUUID(),
        },
      })

      const acceptUrl = buildTeamInviteUrl(invite.token)
      const mail = teamInviteEmail({ inviterName, websiteName: website.name, acceptUrl })
      await sendEmail({ ...mail, to: normalizedEmail })

      return NextResponse.json(
        { pending: true, email: normalizedEmail, expiresAt: invite.expiresAt },
        { status: 201 }
      )
    }

    const existing = await prisma.teamMember.findUnique({
      where: { userId_websiteId: { userId: invitedUser.id, websiteId: website.id } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Bu kullanıcı zaten takımda' }, { status: 409 })
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

    const acceptUrl = `${baseUrl}/dashboard`
    const mail = teamInviteEmail({ inviterName, websiteName: website.name, acceptUrl })
    await sendEmail({ ...mail, to: normalizedEmail })

    return NextResponse.json(teamMember, { status: 201 })
  } catch (error) {
    console.error('Invite team member error:', error)
    return NextResponse.json({ error: 'Davet gönderilemedi' }, { status: 500 })
  }
}
