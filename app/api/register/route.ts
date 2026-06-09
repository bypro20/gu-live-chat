import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validators/auth'
import { generateWebsiteId } from '@/lib/utils'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'
import { acceptTeamInvite } from '@/lib/team-invite'
import { startTrial } from '@/lib/trial'

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req)
    if (await isIpBanned(clientIp)) {
      return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
    }

    const body = await req.json()
    const validated = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(validated.password, 12)

    if (validated.inviteToken) {
      const user = await prisma.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          passwordHash,
          lastIp: clientIp,
        },
      })

      const inviteResult = await acceptTeamInvite(
        validated.inviteToken,
        user.id,
        validated.email
      )

      if ('error' in inviteResult) {
        await prisma.user.delete({ where: { id: user.id } })
        return NextResponse.json({ error: inviteResult.error }, { status: 400 })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        invited: true,
        website: {
          websiteId: inviteResult.websitePublicId,
        },
      }, { status: 201 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          passwordHash,
          lastIp: clientIp,
        },
      })

      const website = await tx.website.create({
        data: {
          name: validated.websiteName!,
          domain: validated.websiteDomain!,
          websiteId: generateWebsiteId(),
          ownerId: user.id,
        },
      })

      await tx.teamMember.create({
        data: {
          userId: user.id,
          websiteId: website.id,
          role: 'OWNER',
          acceptedAt: new Date(),
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: { activeWebsiteId: website.websiteId },
      })

      return { user, website }
    })

    try {
      await startTrial(result.website.websiteId)
    } catch (trialErr) {
      console.error('[register] trial start failed:', trialErr)
    }

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      website: {
        id: result.website.id,
        websiteId: result.website.websiteId,
      },
    }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}
