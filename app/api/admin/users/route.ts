import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { mapAdminUser } from '@/lib/admin-users'

const createUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  name: z.string().min(1).optional(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
})

export async function GET(req: NextRequest) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ]
    }

    if (role && (role === 'ADMIN' || role === 'USER')) {
      where.role = role
    }

    if (status === 'banned' || status === 'BANNED') {
      where.isBanned = true
    } else if (status === 'muted' || status === 'MUTED') {
      where.isMuted = true
    } else if (status === 'active' || status === 'ACTIVE') {
      where.isBanned = false
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
      },
    })

    return NextResponse.json(users.map(mapAdminUser))
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const body = await req.json()
    const validated = createUserSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: validated.email.trim().toLowerCase() },
    })
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanılıyor' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(validated.password, 12)

    const user = await prisma.user.create({
      data: {
        email: validated.email.trim().toLowerCase(),
        name: validated.name?.trim() || null,
        passwordHash,
        role: validated.role,
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
        _count: {
          select: {
            ownedWebsites: true,
            assignedConversations: true,
          },
        },
      },
    })

    return NextResponse.json(mapAdminUser(user), { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }
    console.error('Admin create user error:', error)
    return NextResponse.json({ error: 'Kullanıcı oluşturulamadı' }, { status: 500 })
  }
}
