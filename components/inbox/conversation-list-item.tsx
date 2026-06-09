'use client'

import { memo } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChannelBadge } from './channel-badge'
import type { InboxConversation } from './types'
import { STATUS_LABELS, timeAgo, visitorDisplayName } from './utils'

const STATUS_DOT: Record<string, string> = {
  OPEN: 'bg-emerald-500',
  PENDING: 'bg-amber-500',
  RESOLVED: 'bg-muted-foreground/60',
  CLOSED: 'bg-border',
}

export const ConversationListItem = memo(function ConversationListItem({
  conversation,
  selected,
  onClick,
}: {
  conversation: InboxConversation
  selected: boolean
  onClick: () => void
}) {
  const name = visitorDisplayName(conversation.visitor.name, conversation.visitor.email)
  const initial = name.charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full px-3 py-3 flex items-start gap-3 border-b border-border/60 transition-colors text-left',
        'hover:bg-muted/50',
        selected && 'bg-primary/5 border-l-2 border-l-primary',
        conversation.unreadCount > 0 && !selected && 'bg-primary/[0.03]'
      )}
    >
      <div className="relative shrink-0">
        <Avatar
          src={conversation.visitor.avatarUrl}
          fallback={initial}
          size="lg"
          className="!bg-primary/10 !from-primary/20 !to-primary/30 !text-primary"
        />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
            STATUS_DOT[conversation.status] || 'bg-muted-foreground'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                'text-sm truncate',
                conversation.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'
              )}
            >
              {name}
            </span>
            {conversation.source && conversation.source !== 'WIDGET' && (
              <ChannelBadge source={conversation.source} size="xs" />
            )}
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        <p
          className={cn(
            'text-[13px] truncate mt-0.5 leading-snug',
            conversation.unreadCount > 0 ? 'text-foreground/80 font-medium' : 'text-muted-foreground'
          )}
        >
          {conversation.lastMessagePreview || 'Henüz mesaj yok'}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-medium">
            {STATUS_LABELS[conversation.status] || conversation.status}
          </Badge>
          {conversation.assignedTo?.name && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              → {conversation.assignedTo.name}
            </span>
          )}
        </div>
      </div>
      {conversation.unreadCount > 0 && (
        <Badge className="h-5 min-w-5 px-1.5 text-[10px] font-semibold shrink-0">
          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
        </Badge>
      )}
    </button>
  )
})
