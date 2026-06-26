import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  assertConversationMemberAccess,
  deleteMessageInConversation,
} from '@/lib/inbox-delete'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { conversationId, messageId } = await params

  try {
    const access = await assertConversationMemberAccess(session.user.id, conversationId)
    if (!access) {
      return NextResponse.json({ error: 'Sohbet bulunamadı veya erişim reddedildi' }, { status: 404 })
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
    console.error('[Delete message] error:', error)
    return NextResponse.json({ error: 'Mesaj silinemedi' }, { status: 500 })
  }
}
