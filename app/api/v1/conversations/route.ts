import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function authorize(req: NextRequest): boolean {
  const token = process.env.PUBLIC_API_TOKEN?.trim()
  if (!token) return false
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${token}`
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Gecersiz API token' }, { status: 401 })
  }

  const websitePublicId = req.nextUrl.searchParams.get('websiteId')
  if (!websitePublicId) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  const website = await prisma.website.findUnique({
    where: { websiteId: websitePublicId },
    select: { id: true },
  })
  if (!website) {
    return NextResponse.json({ error: 'Site bulunamadi' }, { status: 404 })
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '25', 10), 100)
  const conversations = await prisma.conversation.findMany({
    where: { websiteId: website.id },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
    select: {
      id: true,
      status: true,
      lastMessageAt: true,
      lastMessagePreview: true,
      unreadCount: true,
      visitor: { select: { name: true, email: true } },
    },
  })

  return NextResponse.json({ data: conversations })
}
