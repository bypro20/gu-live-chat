import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authorizeWebsiteApi } from '@/lib/website-api-auth'

export async function GET(req: NextRequest) {
  const websitePublicId = req.nextUrl.searchParams.get('websiteId')
  if (!websitePublicId) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  const auth = await authorizeWebsiteApi(req, websitePublicId)
  if (!auth.ok) return auth.response

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '25', 10), 100)
  const conversations = await prisma.conversation.findMany({
    where: { websiteId: auth.websiteDbId },
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
