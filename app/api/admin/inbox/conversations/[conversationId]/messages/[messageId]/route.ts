import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { resolveAdminInboxSite } from '@/lib/admin-inbox-setup'
import { deleteMessageInConversation } from '@/lib/inbox-delete'
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
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { conversationId, messageId } = await params
    const conversation = await getAdminConversation(conversationId, check.user.id)
    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    const deleted = await deleteMessageInConversation(conversationId, messageId)
    if (!deleted) {
      return NextResponse.json({ error: 'Mesaj bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, messageId })
  } catch (error) {
    if (error instanceof Error && error.message === 'SYSTEM_MESSAGE') {
      return NextResponse.json({ error: 'Sistem mesajları silinemez' }, { status: 400 })
    }
    console.error('[Admin delete message] error:', error)
    return NextResponse.json({ error: 'Mesaj silinemedi' }, { status: 500 })
  }
}
