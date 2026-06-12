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

  const visitorIds = new Set(
    messages.filter((m) => m.senderType === 'VISITOR').slice(-5).map((m) => m.id)
  )

  return (
    <>
      {messages.map((msg, index) => {
        const dateKey = new Date(msg.createdAt).toDateString()
        const showDateDivider = dateKey !== lastDateKey
        if (showDateDivider) lastDateKey = dateKey

        const prev = messages[index - 1]
        const isGrouped =
          !!prev &&
          prev.senderType === msg.senderType &&
          msg.senderType !== 'SYSTEM' &&
          new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 120_000

        return (
          <div key={msg.id}>
            {showDateDivider && (
              <div className="flex justify-center py-2">
                <span className="text-[11px] font-semibold text-slate-500 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                  {formatDateDivider(msg.createdAt, d, locale)}
                </span>
              </div>
            )}
            <MessageBubble
              message={msg}
              autoTranslate={autoTranslate && visitorIds.has(msg.id)}
              canTranslate={canTranslate}
              websiteId={websiteId}
              agentLang={agentLang}
              primaryColor={primaryColor}
              grouped={isGrouped}
              senderName={msg.senderName}
              senderImage={msg.senderImage}
            />
          </div>
        )
      })}
    </>
  )
})
