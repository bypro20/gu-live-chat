'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import { ticketChannelLabels, ticketPriorityLabels } from '@/lib/settings-i18n'
import Link from 'next/link'

export default function NewTicketPage() {
  const i18n = useSettingsI18n()
  const { tickets: t, common: c } = i18n
  const CHANNEL_OPTIONS = Object.entries(ticketChannelLabels(i18n)).map(([value, label]) => ({ value, label }))
  const PRIORITY_OPTIONS = Object.entries(ticketPriorityLabels(i18n)).map(([value, label]) => ({ value, label }))

  const router = useRouter()
  const { activeWebsite } = useActiveWebsite()
  const [form, setForm] = useState({
    subject: '',
    requesterName: '',
    requesterEmail: '',
    description: '',
    channel: 'EMAIL',
    priority: 'MEDIUM',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWebsite?.websiteId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, websiteId: activeWebsite.websiteId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t.createFailed)
        return
      }
      router.push(`/settings/tickets/${data.id}`)
    } catch {
      setError(c.connectionError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings/tickets"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {t.backToTickets}
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold">{t.newTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-xl p-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.subject}</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            placeholder={t.subjectPlaceholder}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.customerName}</label>
            <input
              name="requesterName"
              value={form.requesterName}
              onChange={handleChange}
              placeholder={t.customerNamePlaceholder}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.customerEmail}</label>
            <input
              name="requesterEmail"
              value={form.requesterEmail}
              onChange={handleChange}
              required
              type="email"
              placeholder={t.customerEmailPlaceholder}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.channel}</label>
            <select
              name="channel"
              value={form.channel}
              onChange={handleChange}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.priority}</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t.description}</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder={t.descriptionPlaceholder}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Link
            href="/settings/tickets"
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            {c.cancel}
          </Link>
          <button
            type="submit"
            disabled={loading || !activeWebsite}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? t.creating : t.createTicket.replace('+ ', '')}
          </button>
        </div>
      </form>
    </div>
  )
}
