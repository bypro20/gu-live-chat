import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { banIpAddress } from '@/lib/ip-ban'
import { lookupIpGeo } from '@/lib/geo'
import { mapAdminUser } from '@/lib/admin-users'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        isMuted: true,
        bannedIp: true,
        banReason: true,
        bannedAt: true,
        mutedUntil: true,
        lastSeenAt: true,
        lastIp: true,
        createdAt: true,
        _count: {
          select: {
            ownedWebsites: true,
            assignedConversations: true,
          },
        },
        ownedWebsites: {
          select: { id: true, name: true, domain: true, plan: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const geo = user.lastIp ? await lookupIpGeo(user.lastIp) : null

    return NextResponse.json({
      ...mapAdminUser(user),
      geo,
    })
  } catch (error) {
    console.error('Admin get user error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error
    const session = check.user

    const { userId } = await params
    const body = await req.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    }

    let updated: Record<string, unknown> | null = null

    switch (action) {
      case 'ban': {
        if (userId === session.id) {
          return NextResponse.json({ error: 'Kendinizi yasaklayamazsınız' }, { status: 400 })
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { lastIp: true },
        })

        const data: Record<string, unknown> = {
          isBanned: true,
          banReason: body.reason || null,
          bannedAt: new Date(),
        }

        if (body.banIp && targetUser?.lastIp) {
          data.bannedIp = targetUser.lastIp
          await banIpAddress(targetUser.lastIp, body.reason || 'Admin tarafından engellendi', session.id)
        }

        updated = await prisma.user.update({
          where: { id: userId },
          data,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isBanned: true,
            isMuted: true,
            bannedIp: true,
            banReason: true,
            bannedAt: true,
            mutedUntil: true,
            lastSeenAt: true,
            lastIp: true,
            createdAt: true,
            _count: { select: { ownedWebsites: true } },
          },
        })
        break
      }

      case 'unban': {
        updated = await prisma.user.update({
          where: { id: userId },
          data: {
            isBanned: false,
            banReason: null,
            bannedIp: null,
            bannedAt: null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isBanned: true,
            isMuted: true,
            bannedIp: true,
            banReason: true,
            bannedAt: true,
            mutedUntil: true,
            lastSeenAt: true,
            lastIp: true,
            createdAt: true,
            _count: { select: { ownedWebsites: true } },
          },
        })
        break
      }

      case 'mute': {
        let mutedUntil: Date | null = new Date(Date.now() + 3600000)
        if (body.durationSeconds === null) {
          mutedUntil = null
        } else if (body.durationSeconds != null) {
          mutedUntil = new Date(Date.now() + body.durationSeconds * 1000)
        } else if (body.duration != null) {
          mutedUntil = new Date(Date.now() + body.duration)
        }

        updated = await prisma.user.update({
          where: { id: userId },
          data: {
            isMuted: true,
            mutedUntil,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isBanned: true,
            isMuted: true,
            mutedUntil: true,
            lastSeenAt: true,
            lastIp: true,
            createdAt: true,
            _count: { select: { ownedWebsites: true } },
          },
        })
        break
      }

      case 'unmute': {
        updated = await prisma.user.update({
          where: { id: userId },
          data: {
            isMuted: false,
            mutedUntil: null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isBanned: true,
            isMuted: true,
            mutedUntil: true,
            lastSeenAt: true,
            lastIp: true,
            createdAt: true,
            _count: { select: { ownedWebsites: true } },
          },
        })
        break
      }

      case 'banIp': {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { lastIp: true, bannedIp: true },
        })
        const ip = body.ip || targetUser?.lastIp || targetUser?.bannedIp
        if (!ip) {
          return NextResponse.json({ error: 'Kullanıcının IP adresi bulunamadı' }, { status: 400 })
        }
        await banIpAddress(ip, body.reason || 'Admin tarafından engellendi', session.id, body.expiresAt ? new Date(body.expiresAt) : null)
        updated = await prisma.user.update({
          where: { id: userId },
          data: { bannedIp: ip },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isBanned: true,
            isMuted: true,
            bannedIp: true,
            banReason: true,
            bannedAt: true,
            lastIp: true,
            lastSeenAt: true,
            createdAt: true,
            _count: { select: { ownedWebsites: true } },
          },
        })
        break
      }

      case 'role': {
        const { role } = body

        if (!['ADMIN', 'USER'].includes(role)) {
          return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 })
        }

        if (userId === session.id && role !== 'ADMIN') {
          return NextResponse.json({ error: 'Kendi admin yetkinizi kaldıramazsınız' }, { status: 400 })
        }

        updated = await prisma.user.update({
          where: { id: userId },
          data: { role },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isBanned: true,
            isMuted: true,
            lastSeenAt: true,
            lastIp: true,
            createdAt: true,
            _count: { select: { ownedWebsites: true } },
          },
        })
        break
      }

      default:
        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    }

    return NextResponse.json(mapAdminUser(updated as Parameters<typeof mapAdminUser>[0]))
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { userId } = await params

    if (userId === check.user.id) {
      return NextResponse.json({ error: 'Kendinizi silemezsiniz' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ message: 'Kullanıcı ve tüm verileri silindi' })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
