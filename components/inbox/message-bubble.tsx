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
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import { useLocale } from '@/components/marketing/locale-provider'
import { inboxAgentBubbleStyle, inboxVisitorBubbleStyle, resolveInboxPrimary } from '@/lib/inbox-theme'

type MessageBubbleProps = {
  message: InboxMessage
  autoTranslate?: boolean
  canTranslate?: boolean
  websiteId?: string
  agentLang?: string
  primaryColor?: string | null
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
  primaryColor,
  grouped = false,
  senderName,
  senderImage,
}: MessageBubbleProps) {
  const inbox = useDashboardI18n().inbox
  const { locale } = useLocale()
  const primary = resolveInboxPrimary(primaryColor)
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
  }, [autoTranslate, isVisitor, canTranslate, message.content, translatedText, translating, handleTranslate])

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-slate-500 bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
          {message.content}
        </span>
      </div>
    )
  }

  const hasAtt = !!(message.attachments && message.attachments.length > 0)
  const hideText = hasAtt && /^(🖼️|📎)\s/u.test(message.content)
  const agentLabel = isBot ? 'Bot' : senderName || inbox.agentLabel

  return (
    <div className={`flex gap-2.5 ${isVisitor ? 'justify-start' : 'justify-end'} ${grouped ? 'mt-0.5' : 'mt-2'}`}>
      {isVisitor && !grouped && (
        <Avatar
          fallback="Z"
          size="sm"
          className="!w-8 !h-8 shrink-0 mt-0.5 !bg-indigo-100 !text-indigo-700 text-[10px] ring-2 ring-white shadow-sm"
        />
      )}
      {isVisitor && grouped && <div className="w-8 shrink-0" />}

      <div className={`max-w-[min(78%,520px)] ${isVisitor ? '' : 'items-end flex flex-col'}`}>
        {!grouped && !isVisitor && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500 mb-1 mr-1 justify-end font-medium">
            {isBot && <Bot className="w-3 h-3" />}
            {agentLabel}
          </span>
        )}
        {isBot && grouped && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500 mb-1 justify-end font-medium">
            <Bot className="w-3 h-3" />
            Bot
          </span>
        )}
        {isVisitor && message.sentiment === 'NEGATIVE' && (
          <Badge variant="destructive" className="mb-1 text-[10px] h-5 gap-1">
            <AlertTriangle className="w-3 h-3" />
            {inbox.negativeSentiment.split('—')[0]?.trim() || inbox.negativeSentiment}
          </Badge>
        )}
        {(message.content || hasAtt) && (
          <div
            className={`px-4 py-3 text-[14px] leading-relaxed transition-shadow ${
              isVisitor
                ? 'rounded-[8px_22px_22px_22px]'
                : 'rounded-[22px_8px_22px_22px]'
            }`}
            style={isVisitor ? inboxVisitorBubbleStyle() : inboxAgentBubbleStyle(primary)}
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
                    ? 'text-slate-500 border-slate-200'
                    : 'text-white/85 border-white/25'
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
          <span className="text-[10px] text-slate-400 tabular-nums">
            {formatMessageTime(message.createdAt, locale)}
          </span>
          {isVisitor && canTranslate && message.content && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 text-slate-400 hover:text-indigo-600"
              onClick={() => void handleTranslate()}
              disabled={translating}
              title={inbox.translateMessage}
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
          className="!w-8 !h-8 shrink-0 mt-0.5 ring-2 ring-white shadow-sm !bg-indigo-100 !text-indigo-700 text-[10px]"
        />
      )}
      {!isVisitor && grouped && <div className="w-8 shrink-0" />}
    </div>
  )
})
