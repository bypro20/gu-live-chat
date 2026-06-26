'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import { Button } from '@/components/ui/button'

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
  currentPage: string | null
  landingPage: string | null
  referrer: string | null
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
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/contacts/${visitorId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setVisitor(null)
          return
        }
        setVisitor(data)
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          notes: data.notes || '',
        })
      })
      .catch(() => setVisitor(null))
      .finally(() => setLoading(false))
  }, [visitorId])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/contacts/${visitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || c.saveFailed)
      setVisitor((v) => (v ? { ...v, ...form } : v))
      setMessage(c.saveSuccess)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : c.saveFailed)
    } finally {
      setSaving(false)
    }
  }

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

      <div className="surface p-6 mb-6 space-y-4">
        <h1 className="text-xl font-bold">{c.editProfile}</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{c.person}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">E-mail</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{c.phone}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{c.notes}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {(visitor.landingPage || visitor.currentPage || visitor.referrer) && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
            {visitor.landingPage && <p>{c.landingPage}: {visitor.landingPage}</p>}
            {visitor.currentPage && <p>{c.currentPage}: {visitor.currentPage}</p>}
            {visitor.referrer && <p>{c.referrer}: {visitor.referrer}</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {[visitor.city, visitor.country].filter(Boolean).join(', ') || c.locationUnknown}
          {visitor.browser && ` · ${visitor.browser} / ${visitor.device}`}
        </p>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? common.loading : common.save}
        </Button>
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
