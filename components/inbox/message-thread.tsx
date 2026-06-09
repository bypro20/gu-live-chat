'use client'

import { memo } from 'react'
import { MessageBubble } from './message-bubble'
import type { InboxMessage } from './types'
import { formatDateDivider } from './utils'

type MessageThreadProps = {
  messages: InboxMessage[]
  autoTranslate?: boolean
  canTranslate?: boolean
  websiteId?: string
  agentLang?: string
}

export const MessageThread = memo(function MessageThread({
  messages,
  autoTranslate,
  canTranslate,
  websiteId,
  agentLang,
}: MessageThreadProps) {
  let lastDateKey = ''

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
                <span className="text-[11px] font-medium text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
                  {formatDateDivider(msg.createdAt)}
                </span>
              </div>
            )}
            <MessageBubble
              message={msg}
              autoTranslate={autoTranslate}
              canTranslate={canTranslate}
              websiteId={websiteId}
              agentLang={agentLang}
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
