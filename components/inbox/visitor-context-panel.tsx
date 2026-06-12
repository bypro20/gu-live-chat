'use client'

import { useEffect, useState, type ReactNode, type ComponentType } from 'react'
import Link from 'next/link'
import {
  Globe,
  Mail,
  MapPin,
  Monitor,
  MessageSquare,
  ExternalLink,
  User,
  Phone,
  Loader2,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getStatusLabels, visitorDisplayName } from './utils'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import { useLocale } from '@/components/marketing/locale-provider'
import type { InboxConversation } from './types'

type VisitorDetail = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  country: string | null
  city: string | null
  browser: string | null
  os: string | null
  device: string | null
  currentPage: string | null
  landingPage: string | null
  referrer: string | null
  deviceType: string | null
  notes: string | null
  conversations: Array<{
    id: string
    status: string
    lastMessageAt: string
    lastMessagePreview: string | null
  }>
}

export function VisitorContextPanel({
  conversation,
  onClose,
}: {
  conversation: InboxConversation
  onClose?: () => void
}) {
  const d = useDashboardI18n()
  const i = d.inbox
  const statusLabels = getStatusLabels(d)
  const { locale } = useLocale()
  const visitorId = conversation.visitorId || conversation.visitor?.id
  const [detail, setDetail] = useState<VisitorDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visitorId) return
    setLoading(true)
    fetch(`/api/contacts/${visitorId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [visitorId])

  const name = visitorDisplayName(
    detail?.name ?? conversation.visitor.name,
    detail?.email ?? conversation.visitor.email,
    d
  )

  return (
    <aside className="hidden xl:flex w-[300px] shrink-0 flex-col border-l border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{i.visitor}</h2>
        {onClose && (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs xl:hidden" onClick={onClose}>
            {i.close}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex flex-col items-center text-center gap-2">
          <Avatar
            src={conversation.visitor.avatarUrl}
            fallback={name.charAt(0).toUpperCase()}
            size="lg"
            className="!w-14 !h-14 !bg-primary/10 !text-primary"
          />
          <div>
            <p className="font-semibold text-foreground">{name}</p>
            <Badge variant="outline" className="mt-1 text-[10px]">
              {statusLabels[conversation.status] || conversation.status}
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <InfoSection title={i.contactSection}>
              {detail?.email && (
                <InfoRow icon={Mail} label={i.email} value={detail.email} />
              )}
              {detail?.phone && (
                <InfoRow icon={Phone} label={i.phone} value={detail.phone} />
              )}
              {!detail?.email && !detail?.phone && (
                <p className="text-xs text-muted-foreground">{i.noContactInfo}</p>
              )}
            </InfoSection>

            <InfoSection title={i.locationSection}>
              {(detail?.city || detail?.country) && (
                <InfoRow
                  icon={MapPin}
                  label={i.location}
                  value={[detail?.city, detail?.country].filter(Boolean).join(', ')}
                />
              )}
              {(detail?.browser || detail?.os) && (
                <InfoRow
                  icon={Monitor}
                  label={i.device}
                  value={[detail?.deviceType, detail?.browser, detail?.os].filter(Boolean).join(' · ')}
                />
              )}
            </InfoSection>

            {(detail?.currentPage || detail?.landingPage) && (
              <InfoSection title={i.pageSection}>
                {detail.currentPage && (
                  <InfoRow icon={Globe} label={i.currentPage} value={detail.currentPage} link />
                )}
                {detail.landingPage && detail.landingPage !== detail.currentPage && (
                  <InfoRow icon={Globe} label={i.landingPage} value={detail.landingPage} link />
                )}
                {detail.referrer && (
                  <InfoRow icon={ExternalLink} label={i.sourceLabel} value={detail.referrer} link />
                )}
              </InfoSection>
            )}

            {conversation.assignedTo?.name && (
              <InfoSection title={i.assignedSection}>
                <InfoRow icon={User} label={i.agentLabel} value={conversation.assignedTo.name} />
              </InfoSection>
            )}

            {detail?.conversations && detail.conversations.length > 0 && (
              <InfoSection title={i.historySection}>
                <div className="space-y-2">
                  {detail.conversations.slice(0, 5).map((c) => (
                    <div key={c.id} className="rounded-lg border border-border/80 p-2.5 bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-foreground">
                          {statusLabels[c.status] || c.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {new Date(c.lastMessageAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR')}
                        </span>
                      </div>
                      {c.lastMessagePreview && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {c.lastMessagePreview}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </InfoSection>
            )}
          </>
        )}

        {visitorId && (
          <Link href={`/contacts/${visitorId}`}>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              {i.openCrm}
            </Button>
          </Link>
        )}
      </div>
    </aside>
  )
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  link?: boolean
}) {
  const isUrl = link && (value.startsWith('http') || value.startsWith('/'))
  return (
    <div className="flex gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        {isUrl ? (
          <a
            href={value.startsWith('http') ? value : `https://${value.replace(/^\/\//, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all line-clamp-2"
          >
            {value}
          </a>
        ) : (
          <p className="text-foreground break-words">{value}</p>
        )}
      </div>
    </div>
  )
}
