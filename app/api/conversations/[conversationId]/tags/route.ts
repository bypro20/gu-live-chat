import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const tagMutationSchema = z.object({
  tagId: z.string().optional(),
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

async function assertConversationAccess(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, websiteId: true },
  })
  if (!conversation) return { error: NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 }) }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: conversation.websiteId, userId },
  })
  if (!member) return { error: NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 }) }

  return { conversation }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { conversationId } = await params

  try {
    const body = await req.json()
    const validated = tagMutationSchema.parse(body)
    if (!validated.tagId && !validated.name) {
      return NextResponse.json({ error: 'Etiket ID veya adı gerekli' }, { status: 400 })
    }

    const access = await assertConversationAccess(conversationId, session.user.id)
    if ('error' in access && access.error) return access.error
    const { conversation } = access

    let tagId = validated.tagId
    if (!tagId && validated.name) {
      const tag = await prisma.tag.upsert({
        where: {
          websiteId_name: {
            websiteId: conversation!.websiteId,
            name: validated.name,
          },
        },
        create: {
          websiteId: conversation!.websiteId,
          name: validated.name,
          color: validated.color || '#146356',
        },
        update: {},
        select: { id: true },
      })
      tagId = tag.id
    }

    await prisma.conversationTag.upsert({
      where: {
        conversationId_tagId: {
          conversationId,
          tagId: tagId!,
        },
      },
      create: { conversationId, tagId: tagId! },
      update: {},
    })

    const tags = await prisma.conversationTag.findMany({
      where: { conversationId },
      include: { tag: { select: { id: true, name: true, color: true } } },
    })

    return NextResponse.json({
      tags: tags.map((row) => row.tag),
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz etiket verisi' }, { status: 400 })
    }
    console.error('Conversation tag add error:', error)
    return NextResponse.json({ error: 'Etiket eklenemedi' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { conversationId } = await params
  const { searchParams } = new URL(req.url)
  const tagId = searchParams.get('tagId')
  if (!tagId) {
    return NextResponse.json({ error: 'Etiket ID gerekli' }, { status: 400 })
  }

  const access = await assertConversationAccess(conversationId, session.user.id)
  if ('error' in access && access.error) return access.error

  await prisma.conversationTag.deleteMany({
    where: { conversationId, tagId },
  })

  const tags = await prisma.conversationTag.findMany({
    where: { conversationId },
    include: { tag: { select: { id: true, name: true, color: true } } },
  })

  return NextResponse.json({
    tags: tags.map((row) => row.tag),
  })
}
