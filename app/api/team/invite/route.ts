import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { acceptTeamInvite } from '@/lib/team-invite'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Davet kodu gerekli' }, { status: 400 })
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { website: { select: { name: true, websiteId: true } } },
  })

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Davet geçersiz veya süresi dolmuş' }, { status: 404 })
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    websiteName: invite.website.name,
    websiteId: invite.website.websiteId,
    expiresAt: invite.expiresAt,
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const token = body.token as string | undefined
    if (!token) {
      return NextResponse.json({ error: 'Davet kodu gerekli' }, { status: 400 })
    }

    const result = await acceptTeamInvite(token, session.user.id, session.user.email)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      websiteId: result.websitePublicId,
      redirect: '/dashboard',
    })
  } catch (error) {
    console.error('Accept team invite error:', error)
    return NextResponse.json({ error: 'Davet kabul edilemedi' }, { status: 500 })
  }
}
