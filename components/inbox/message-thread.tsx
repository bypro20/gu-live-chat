'use client'

import { memo } from 'react'
import { MessageBubble } from './message-bubble'
import type { InboxMessage } from './types'
import { formatDateDivider } from './utils'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import { useLocale } from '@/components/marketing/locale-provider'

type MessageThreadProps = {
  messages: InboxMessage[]
  autoTranslate?: boolean
  canTranslate?: boolean
  websiteId?: string
  agentLang?: string
  primaryColor?: string | null
}

export const MessageThread = memo(function MessageThread({
  messages,
  autoTranslate,
  canTranslate,
  websiteId,
  agentLang,
  primaryColor,
}: MessageThreadProps) {
  const d = useDashboardI18n()
  const { locale } = useLocale()
  let lastDateKey = ''

  const shouldAutoTranslate = (senderType: InboxMessage['senderType']) =>
    senderType === 'VISITOR' || senderType === 'BOT'

  return (
    <>
      {messages.map((msg, index) => {
        const dateKey = new Date(msg.createdAt).toDateString()
        const showDateDivider = dateKey !== lastDateKey
        if (showDateDivider) lastDateKey = dateKey

        const prev = messages[index - 1]
        const next = messages[index + 1]
        const sameSender = (a: InboxMessage, b: InboxMessage) =>
          a.senderType === b.senderType && a.senderType !== 'SYSTEM'

        const isGrouped =
          !!prev &&
          sameSender(prev, msg) &&
          new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 120_000

        const isLastInGroup =
          !next ||
          !sameSender(msg, next) ||
          new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime() >= 120_000

        const isLatest = index === messages.length - 1

        return (
          <div key={msg.id}>
            {showDateDivider && (
              <div className="flex justify-center py-3">
                <span className="text-[11px] font-medium text-muted-foreground bg-card/95 backdrop-blur-sm px-3 py-1 rounded-full border border-border shadow-sm">
                  {formatDateDivider(msg.createdAt, d, locale)}
                </span>
              </div>
            )}
            <MessageBubble
              message={msg}
              autoTranslate={autoTranslate && shouldAutoTranslate(msg.senderType)}
              canTranslate={canTranslate}
              websiteId={websiteId}
              agentLang={agentLang}
              primaryColor={primaryColor}
              grouped={isGrouped}
              isLastInGroup={isLastInGroup}
              animateIn={isLatest}
              senderName={msg.senderName}
              senderImage={msg.senderImage}
            />
          </div>
        )
      })}
    </>
  )
})
