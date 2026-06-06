import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { banIpAddress } from '@/lib/ip-ban'
import { getClientIp } from '@/lib/ip-utils'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const { userId } = await params
    const body = await req.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    }

    let updated: Record<string, unknown> | null = null

    switch (action) {
      case 'ban': {
        if (userId === session.user.id) {
          return NextResponse.json({ error: 'Kendinizi yasaklayamazsınız' }, { status: 400 })
        }

        const data: Record<string, unknown> = {
          isBanned: true,
          banReason: body.reason || null,
          bannedAt: new Date(),
        }

        if (body.banIp) {
          const forwarded = req.headers.get('x-forwarded-for')
          const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
          if (ip) {
            data.bannedIp = ip
          }
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
          },
        })
        break
      }

      case 'mute': {
        const duration = body.duration || 3600000
        updated = await prisma.user.update({
          where: { id: userId },
          data: {
            isMuted: true,
            mutedUntil: new Date(Date.now() + duration),
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isBanned: true,
            isMuted: true,
            mutedUntil: true,
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
        await banIpAddress(ip, body.reason || 'Admin tarafından engellendi', session.user.id)
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
          },
        })
        break
      }

      case 'role': {
        const { role } = body

        if (!['ADMIN', 'USER'].includes(role)) {
          return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 })
        }

        if (userId === session.user.id && role !== 'ADMIN') {
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
          },
        })
        break
      }

      default:
        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    }

    return NextResponse.json(updated)
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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const { userId } = await params

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Kendinizi silemezsiniz' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ message: 'Kullanıcı ve tüm verileri silindi' })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
