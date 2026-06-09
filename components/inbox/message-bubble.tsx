'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { Bot, Languages, Loader2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { translateClient } from '@/lib/translate-client'
import { AttachmentList } from './attachment-list'
import type { InboxMessage } from './types'
import { formatMessageTime } from './utils'

type MessageBubbleProps = {
  message: InboxMessage
  autoTranslate?: boolean
  canTranslate?: boolean
  websiteId?: string
  /** Temsilcinin panel dili — gelen mesajlar buna çevrilir */
  agentLang?: string
  grouped?: boolean
  senderName?: string | null
  senderImage?: string | null
}

export const MessageBubble = memo(function MessageBubble({
  message,
  autoTranslate = false,
  canTranslate = false,
  websiteId,
  agentLang = 'tr',
  grouped = false,
  senderName,
  senderImage,
}: MessageBubbleProps) {
  const isVisitor = message.senderType === 'VISITOR'
  const isSystem = message.senderType === 'SYSTEM' || message.type === 'SYSTEM'
  const isBot = message.senderType === 'BOT'
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [showTranslate, setShowTranslate] = useState(false)

  const handleTranslate = useCallback(async () => {
    if (translatedText) {
      setShowTranslate((v) => !v)
      return
    }
    setTranslating(true)
    try {
      const data = await translateClient({
        text: message.content,
        toLang: agentLang,
        websiteId,
      })
      if (data.translatedText && data.translatedText !== message.content) {
        setTranslatedText(data.translatedText)
        setShowTranslate(true)
      }
    } catch {
      /* ignore */
    } finally {
      setTranslating(false)
    }
  }, [message.content, translatedText, websiteId, agentLang])

  useEffect(() => {
    setTranslatedText(null)
    setShowTranslate(false)
  }, [agentLang, message.id])

  useEffect(() => {
    if (autoTranslate && isVisitor && canTranslate && message.content && !translatedText && !translating) {
      void handleTranslate()
    }
  }, [autoTranslate, isVisitor, canTranslate, message.content, translatedText, translating, handleTranslate, agentLang])

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  const hasAtt = !!(message.attachments && message.attachments.length > 0)
  const hideText = hasAtt && /^(🖼️|📎)\s/u.test(message.content)

  const agentLabel = isBot ? 'Bot' : senderName || 'Temsilci'

  return (
    <div className={`flex gap-2.5 ${isVisitor ? 'justify-start' : 'justify-end'} ${grouped ? 'mt-0.5' : 'mt-1'}`}>
      {isVisitor && !grouped && (
        <Avatar
          fallback="Z"
          size="sm"
          className="!w-7 !h-7 shrink-0 mt-1 !bg-muted !text-muted-foreground text-[10px]"
        />
      )}
      {isVisitor && grouped && <div className="w-7 shrink-0" />}
      <div className={`max-w-[min(78%,520px)] ${isVisitor ? '' : 'items-end flex flex-col'}`}>
        {!grouped && !isVisitor && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1 mr-0.5 justify-end">
            {isBot && <Bot className="w-3 h-3" />}
            {agentLabel}
          </span>
        )}
        {isBot && grouped && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1 ml-0.5 justify-end">
            <Bot className="w-3 h-3" />
            Bot
          </span>
        )}
        {isVisitor && message.sentiment === 'NEGATIVE' && (
          <Badge variant="destructive" className="mb-1 text-[10px] h-5 gap-1">
            <AlertTriangle className="w-3 h-3" />
            Olumsuz ton
          </Badge>
        )}
        {(message.content || hasAtt) && (
          <div
            className={`px-3.5 py-2.5 text-[14px] leading-relaxed ${
              isVisitor
                ? 'bg-card text-foreground rounded-2xl rounded-bl-md border border-border/80 shadow-sm'
                : 'bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm'
            }`}
          >
            {!hideText && message.content && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            {hasAtt && (
              <AttachmentList
                attachments={message.attachments!}
                variant={isVisitor ? 'light' : 'dark'}
              />
            )}
            {showTranslate && translatedText && (
              <p
                className={`text-xs mt-2 pt-2 border-t italic ${
                  isVisitor
                    ? 'text-muted-foreground border-border'
                    : 'text-primary-foreground/85 border-primary-foreground/20'
                }`}
              >
                {translatedText}
              </p>
            )}
          </div>
        )}
        <div
          className={`flex items-center gap-1.5 mt-1 px-0.5 ${
            isVisitor ? '' : 'justify-end'
          } ${grouped ? 'hidden' : ''}`}
        >
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {formatMessageTime(message.createdAt)}
          </span>
          {isVisitor && canTranslate && message.content && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              onClick={() => void handleTranslate()}
              disabled={translating}
              title="Çevir"
            >
              {translating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Languages className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>
      </div>
      {!isVisitor && !grouped && (
        <Avatar
          src={senderImage || undefined}
          fallback={(agentLabel.charAt(0) || 'A').toUpperCase()}
          size="sm"
          className="!w-7 !h-7 shrink-0 mt-1 !bg-primary/15 !text-primary text-[10px]"
        />
      )}
      {!isVisitor && grouped && <div className="w-7 shrink-0" />}
    </div>
  )
})
