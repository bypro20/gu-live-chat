'use client'

import Link from 'next/link'
import { ArrowLeft, Languages, UserCheck, CheckCircle2, RotateCcw, User, Monitor } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChannelBadge } from './channel-badge'
import type { InboxConversation } from './types'
import { languageLabel, languagesDiffer } from '@/lib/translate-languages'
import { getStatusLabels, visitorDisplayName } from './utils'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import { inboxHeaderStyle, resolveInboxPrimary } from '@/lib/inbox-theme'

type ChatHeaderProps = {
  conversation: InboxConversation
  onBack?: () => void
  canTranslate?: boolean
  autoTranslate?: boolean
  onToggleTranslate?: () => void
  detectedLang?: string | null
  agentLang?: string
  showAssign?: boolean
  onAssignToMe?: () => void
  onResolve?: () => void
  onReopen?: () => void
  updating?: boolean
  extra?: React.ReactNode
  visitorId?: string
  showVisitorLinks?: boolean
  primaryColor?: string | null
}

export function ChatHeader({
  conversation,
  onBack,
  canTranslate,
  autoTranslate,
  onToggleTranslate,
  detectedLang,
  agentLang = 'tr',
  showAssign,
  onAssignToMe,
  onResolve,
  onReopen,
  updating,
  extra,
  visitorId,
  showVisitorLinks,
  primaryColor,
}: ChatHeaderProps) {
  const d = useDashboardI18n()
  const i = d.inbox
  const primary = resolveInboxPrimary(primaryColor)
  const statusLabels = getStatusLabels(d)
  const name = visitorDisplayName(conversation.visitor.name, conversation.visitor.email, d)
  const initial = name.charAt(0).toUpperCase()
  const isClosed =
    conversation.status === 'RESOLVED' || conversation.status === 'CLOSED'

  return (
    <div
      className="px-3 sm:px-4 py-3.5 flex items-center gap-2 shrink-0 min-w-0 overflow-hidden shadow-md relative"
      style={inboxHeaderStyle(primary)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      {onBack && (
        <Button type="button" variant="ghost" size="icon-sm" className="lg:hidden -ml-1 text-white hover:bg-white/15" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      <Avatar
        src={conversation.visitor.avatarUrl}
        fallback={initial}
        size="lg"
        className="shrink-0 ring-2 ring-white/40 shadow-lg !bg-white/20 !text-white"
      />
      <div className="flex-1 min-w-0 relative z-10">
        <h2 className="font-bold text-white truncate text-[15px] tracking-tight">{name}</h2>
        <div className="flex items-center gap-2 min-w-0 mt-1 flex-wrap">
          <ChannelBadge source={conversation.source} />
          <Badge variant="secondary" className="h-5 text-[10px] font-semibold px-1.5 bg-white/20 text-white border-white/25">
            {statusLabels[conversation.status] || conversation.status}
          </Badge>
          {conversation.visitor.email && (
            <span className="text-xs text-white/80 truncate hidden sm:inline">
              {conversation.visitor.email}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-auto relative z-10">
        {showAssign && onAssignToMe && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden md:inline-flex h-8 text-xs bg-white/10 border-white/25 text-white hover:bg-white/20"
            disabled={updating}
            onClick={onAssignToMe}
          >
            <UserCheck className="w-3.5 h-3.5" />
            {i.assignToMe}
          </Button>
        )}
        {!isClosed && onResolve ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-emerald-500/20 text-white border-emerald-300/40 hover:bg-emerald-500/30"
            disabled={updating}
            onClick={onResolve}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{i.markResolved}</span>
          </Button>
        ) : onReopen ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-white/10 border-white/25 text-white hover:bg-white/20"
            disabled={updating}
            onClick={onReopen}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{i.reopen}</span>
          </Button>
        ) : null}

        {canTranslate && onToggleTranslate && (
          <Button
            type="button"
            variant={autoTranslate ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-8 text-xs gap-1.5',
              autoTranslate
                ? 'bg-white text-indigo-700 hover:bg-white/90'
                : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
            )}
            onClick={onToggleTranslate}
            title={autoTranslate ? i.translateOff : i.translatePro}
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {autoTranslate && detectedLang && languagesDiffer(agentLang, detectedLang)
                ? `${languageLabel(detectedLang)} ↔ ${languageLabel(agentLang)}`
                : i.translate}
            </span>
          </Button>
        )}

        {showVisitorLinks && visitorId && (
          <>
            <Link
              href={`/contacts/${visitorId}`}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white/20 transition"
            >
              <User className="w-3.5 h-3.5" />
              {i.profile}
            </Link>
            <Link
              href="/visitors"
              className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white/20 transition"
            >
              <Monitor className="w-3.5 h-3.5" />
              {i.live}
            </Link>
          </>
        )}

        {extra}
      </div>
    </div>
  )
}
