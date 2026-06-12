'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

interface VisitorDetail {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  country: string | null
  city: string | null
  browser: string | null
  device: string | null
  notes: string | null
  conversations: Array<{
    id: string
    status: string
    lastMessageAt: string
    lastMessagePreview: string | null
  }>
}

export default function ContactDetailPage({ params }: { params: Promise<{ visitorId: string }> }) {
  const { visitorId } = use(params)
  const { contacts: c, common, dateLocale } = useDashboardI18n()
  const [visitor, setVisitor] = useState<VisitorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/contacts/${visitorId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setVisitor(data))
      .catch(() => setVisitor(null))
      .finally(() => setLoading(false))
  }, [visitorId])

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!visitor) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{c.notFound}</p>
        <Link href="/contacts" className="text-primary text-sm mt-2 inline-block">{c.backToContacts}</Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/contacts" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">← {c.title}</Link>
      <div className="surface p-6 mb-6">
        <h1 className="text-xl font-bold">{visitor.name || common.anonymous}</h1>
        <p className="text-sm text-muted-foreground mt-1">{visitor.email || '—'}</p>
        {visitor.phone && <p className="text-sm text-muted-foreground">{visitor.phone}</p>}
        <p className="text-xs text-muted-foreground mt-3">
          {[visitor.city, visitor.country].filter(Boolean).join(', ') || c.locationUnknown}
          {visitor.browser && ` · ${visitor.browser} / ${visitor.device}`}
        </p>
        {visitor.notes && (
          <p className="text-sm mt-4 p-3 bg-muted rounded-lg">{visitor.notes}</p>
        )}
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{c.chat}</h2>
      <div className="surface divide-y divide-border">
        {visitor.conversations.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">{c.noChatsYet}</p>
        ) : (
          visitor.conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/inbox?conversation=${conv.id}`}
              className="block p-4 hover:bg-muted/50 transition"
            >
              <div className="flex justify-between gap-2">
                <span className="text-sm font-medium">{conv.lastMessagePreview || c.defaultChatPreview}</span>
                <span className="text-xs text-muted-foreground shrink-0">{conv.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(conv.lastMessageAt).toLocaleString(dateLocale)}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
