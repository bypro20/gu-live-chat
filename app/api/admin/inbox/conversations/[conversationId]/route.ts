import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { resolveAdminInboxSite } from '@/lib/admin-inbox-setup'
import { deleteConversationById } from '@/lib/inbox-delete'
import { prisma } from '@/lib/db'

async function getAdminConversation(conversationId: string, adminUserId: string) {
  const site = await resolveAdminInboxSite(adminUserId)
  return prisma.conversation.findFirst({
    where: { id: conversationId, websiteId: site.id },
    select: { id: true },
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { conversationId } = await params
    const conversation = await getAdminConversation(conversationId, check.user.id)
    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    await deleteConversationById(conversationId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Admin delete conversation] error:', error)
    return NextResponse.json({ error: 'Sohbet silinemedi' }, { status: 500 })
  }
}
