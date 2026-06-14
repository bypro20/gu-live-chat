import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()
    const websiteId = searchParams.get('websiteId')?.trim()
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 80))
    const cursor = searchParams.get('cursor')?.trim()

    const where: Record<string, unknown> = {}
    if (websiteId) where.websiteId = websiteId
    if (search) {
      where.OR = [
        { lastMessagePreview: { contains: search } },
        { visitor: { name: { contains: search } } },
        { visitor: { email: { contains: search } } },
        { website: { name: { contains: search } } },
        { website: { domain: { contains: search } } },
        { website: { owner: { email: { contains: search } } } },
      ]
    }

    const conversations = await prisma.conversation.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { lastMessageAt: 'desc' },
      select: {
        id: true,
        status: true,
        source: true,
        lastMessageAt: true,
        lastMessagePreview: true,
        unreadCount: true,
        createdAt: true,
        website: {
          select: {
            id: true,
            name: true,
            domain: true,
            websiteId: true,
            plan: true,
            owner: { select: { id: true, email: true, name: true } },
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
            country: true,
            city: true,
          },
        },
        _count: { select: { messages: true } },
      },
    })

    let nextCursor: string | null = null
    if (conversations.length > limit) {
      const next = conversations.pop()
      nextCursor = next?.id ?? null
    }

    return NextResponse.json({ conversations, nextCursor })
  } catch (error) {
    console.error('Admin conversations error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
