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
import { STATUS_LABELS, visitorDisplayName } from './utils'

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
}: ChatHeaderProps) {
  const name = visitorDisplayName(conversation.visitor.name, conversation.visitor.email)
  const initial = name.charAt(0).toUpperCase()
  const isClosed =
    conversation.status === 'RESOLVED' || conversation.status === 'CLOSED'

  return (
    <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 shrink-0">
      {onBack && (
        <Button type="button" variant="ghost" size="icon-sm" className="lg:hidden -ml-1" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      <Avatar
        src={conversation.visitor.avatarUrl}
        fallback={initial}
        size="lg"
        className="shrink-0 !bg-primary/10 !from-primary/20 !to-primary/30 !text-primary"
      />
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-foreground truncate text-[15px]">{name}</h2>
        <div className="flex items-center gap-2 min-w-0 mt-0.5 flex-wrap">
          <ChannelBadge source={conversation.source} />
          <Badge variant="secondary" className="h-5 text-[10px] font-normal px-1.5">
            {STATUS_LABELS[conversation.status] || conversation.status}
          </Badge>
          {conversation.visitor.email && (
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              {conversation.visitor.email}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {showAssign && onAssignToMe && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden md:inline-flex h-8 text-xs"
            disabled={updating}
            onClick={onAssignToMe}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Bana ata
          </Button>
        )}
        {!isClosed && onResolve ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
            disabled={updating}
            onClick={onResolve}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Çözüldü</span>
          </Button>
        ) : onReopen ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={updating}
            onClick={onReopen}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yeniden aç</span>
          </Button>
        ) : null}

        {canTranslate && onToggleTranslate && (
          <Button
            type="button"
            variant={autoTranslate ? 'default' : 'outline'}
            size="sm"
            className={cn('h-8 text-xs gap-1.5', !autoTranslate && 'text-muted-foreground')}
            onClick={onToggleTranslate}
            title={autoTranslate ? 'Çeviriyi kapat' : 'Otomatik çeviri (PRO)'}
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {autoTranslate && detectedLang && languagesDiffer(agentLang, detectedLang)
                ? `${languageLabel(detectedLang)} ↔ ${languageLabel(agentLang)}`
                : 'Çeviri'}
            </span>
          </Button>
        )}

        {showVisitorLinks && visitorId && (
          <>
            <Link
              href={`/contacts/${visitorId}`}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted transition"
            >
              <User className="w-3.5 h-3.5" />
              Profil
            </Link>
            <Link
              href="/visitors"
              className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted transition"
            >
              <Monitor className="w-3.5 h-3.5" />
              Canlı
            </Link>
          </>
        )}

        {extra}
      </div>
    </div>
  )
}
