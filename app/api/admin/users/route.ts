import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { mapAdminUser } from '@/lib/admin-users'
import { buildAdminPaginatedResult, parseAdminListQuery } from '@/lib/admin-list-query'

const createUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  name: z.string().min(1).optional(),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
})

const userSelect = {
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
      memberships: true,
      assignedConversations: true,
    },
  },
} as const

function buildUsersWhere(searchParams: URLSearchParams): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {}
  const search = searchParams.get('search')?.trim()
  const role = searchParams.get('role')
  const status = searchParams.get('status')?.toUpperCase()

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ]
  }

  if (role === 'ADMIN' || role === 'USER') {
    where.role = role
  }

  if (status === 'BANNED') {
    where.isBanned = true
  } else if (status === 'MUTED') {
    where.isMuted = true
    where.mutedUntil = { gt: new Date() }
  } else if (status === 'ACTIVE') {
    where.isBanned = false
  }

  return where
}

function buildUsersOrderBy(sortBy: string | null): Prisma.UserOrderByWithRelationInput {
  switch (sortBy) {
    case 'name':
      return { name: 'asc' }
    case 'email':
      return { email: 'asc' }
    default:
      return { createdAt: 'desc' }
  }
}

export async function GET(req: NextRequest) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parseAdminListQuery(searchParams)
    const where = buildUsersWhere(searchParams)
    const orderBy = buildUsersOrderBy(searchParams.get('sortBy'))

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: userSelect,
      }),
    ])

    return NextResponse.json(
      buildAdminPaginatedResult(users.map(mapAdminUser), total, page, pageSize),
    )
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
      select: userSelect,
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
