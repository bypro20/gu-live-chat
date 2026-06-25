'use client'

import { memo } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChannelBadge } from './channel-badge'
import type { InboxConversation } from './types'
import { timeAgo, visitorDisplayName, getStatusLabels } from './utils'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

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
  variant = 'default',
}: {
  conversation: InboxConversation
  selected: boolean
  onClick: () => void
  variant?: 'default' | 'admin'
}) {
  const d = useDashboardI18n()
  const i = d.inbox
  const statusLabels = getStatusLabels(d)
  const name = visitorDisplayName(conversation.visitor.name, conversation.visitor.email, d)
  const initial = name.charAt(0).toUpperCase()

  const isAdmin = variant === 'admin'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full px-3 py-3.5 flex items-start gap-3 border-b transition-all duration-150 text-left touch-manipulation min-h-[56px]',
        isAdmin
          ? cn(
              'border-border hover:bg-muted/60 active:bg-muted',
              selected && 'inbox-conversation-item--selected border-l-[3px]',
              conversation.unreadCount > 0 && !selected && 'inbox-conversation-item--unread'
            )
          : cn(
              'inbox-conversation-item border-b transition-all duration-150',
              selected && 'inbox-conversation-item--selected border-l-[3px]',
              conversation.unreadCount > 0 && !selected && 'inbox-conversation-item--unread'
            )
      )}
    >
      <div className="relative shrink-0">
        <Avatar
          src={conversation.visitor.avatarUrl}
          fallback={initial}
          size="lg"
          className={isAdmin ? '!bg-primary/10 !from-primary/15 !to-primary/25 !text-primary' : '!bg-primary/10 !from-primary/20 !to-primary/30 !text-primary'}
        />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2',
            isAdmin ? 'border-card' : 'border-card',
            isAdmin
              ? STATUS_DOT[conversation.status] || 'bg-muted-foreground'
              : STATUS_DOT[conversation.status] || 'bg-muted-foreground'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                'text-sm truncate',
                isAdmin
                  ? conversation.unreadCount > 0
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-foreground'
                  : conversation.unreadCount > 0
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-foreground'
              )}
            >
              {name}
            </span>
            {conversation.source && conversation.source !== 'WIDGET' && (
              <ChannelBadge source={conversation.source} size="xs" />
            )}
          </div>
          <span className={cn('text-[11px] shrink-0 tabular-nums', 'text-muted-foreground')}>
            {timeAgo(conversation.lastMessageAt, d)}
          </span>
        </div>
        <p
          className={cn(
            'text-[13px] truncate mt-0.5 leading-snug',
            isAdmin
              ? conversation.unreadCount > 0
                ? 'text-foreground/80 font-medium'
                : 'text-muted-foreground'
              : conversation.unreadCount > 0
                ? 'text-foreground/80 font-medium'
                : 'text-muted-foreground'
          )}
        >
          {conversation.lastMessagePreview || i.noMessages}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] h-4 px-1.5 font-medium',
              isAdmin && 'border-border text-muted-foreground bg-muted/40'
            )}
          >
            {statusLabels[conversation.status] || conversation.status}
          </Badge>
          {conversation.assignedTo?.name && (
            <span className={cn('text-[10px] truncate max-w-[120px]', 'text-muted-foreground')}>
              → {conversation.assignedTo.name}
            </span>
          )}
        </div>
      </div>
      {conversation.unreadCount > 0 && (
        <Badge className="h-5 min-w-5 px-1.5 text-[10px] font-semibold shrink-0 bg-primary hover:bg-primary text-primary-foreground border-0">
          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
        </Badge>
      )}
    </button>
  )
})
