'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import Link from 'next/link'

const CHANNEL_OPTIONS = [
  { value: 'EMAIL', label: 'E-posta' },
  { value: 'WIDGET', label: 'Widget' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'API', label: 'API' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
  { value: 'URGENT', label: 'Acil' },
]

export default function NewTicketPage() {
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
        setError(data.error || 'Bilet oluşturulamadı')
        return
      }
      router.push(`/settings/tickets/${data.ticket?.id || ''}`)
    } catch {
      setError('Bir hata oluştu')
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
          ← Biletler
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold">Yeni Bilet</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-xl p-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Konu *</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            placeholder="Bilet konusu"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Müşteri Adı</label>
            <input
              name="requesterName"
              value={form.requesterName}
              onChange={handleChange}
              placeholder="Ad Soyad"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Müşteri E-posta *</label>
            <input
              name="requesterEmail"
              value={form.requesterEmail}
              onChange={handleChange}
              required
              type="email"
              placeholder="ornek@domain.com"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Kanal</label>
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
            <label className="block text-sm font-medium mb-1.5">Öncelik</label>
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
          <label className="block text-sm font-medium mb-1.5">Açıklama</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder="Sorunun detaylı açıklaması…"
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
            İptal
          </Link>
          <button
            type="submit"
            disabled={loading || !activeWebsite}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor…' : 'Bilet Oluştur'}
          </button>
        </div>
      </form>
    </div>
  )
}
