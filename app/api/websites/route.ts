import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createWebsiteSchema } from '@/lib/validators/website'
import { generateWebsiteId } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
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
          _count: { select: { conversations: true, visitors: true } },
        },
      },
    },
  })

  // Return websites with role information
  const websites = memberships.map((m) => ({
    ...m.website,
    role: m.role,
  }))

  return NextResponse.json(websites)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = createWebsiteSchema.parse(body)

    const website = await prisma.website.create({
      data: {
        name: validated.name,
        domain: validated.domain,
        websiteId: generateWebsiteId(),
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
            acceptedAt: new Date(),
          },
        },
      },
    })

    return NextResponse.json(website, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      )
    }
    console.error('Create website error:', error)
    return NextResponse.json({ error: 'Website oluşturulamadı' }, { status: 500 })
  }
}