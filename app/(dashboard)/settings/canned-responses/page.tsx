'use client'

import { useCallback, useEffect, useState } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'

interface CannedResponse {
  id: string
  title: string
  content: string
  shortcut: string | null
  category: string | null
}

export default function CannedResponsesPage() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('cannedResponses')
  const { activeWebsite } = useActiveWebsite()
  const [items, setItems] = useState<CannedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', shortcut: '', category: '' })
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    if (!activeWebsite?.websiteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/canned-responses?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }, [activeWebsite?.websiteId])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleCreate = async () => {
    if (!activeWebsite || !form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/canned-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: activeWebsite.websiteId,
          title: form.title.trim(),
          content: form.content.trim(),
          shortcut: form.shortcut.trim() || undefined,
          category: form.category.trim() || undefined,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ title: '', content: '', shortcut: '', category: '' })
        fetchItems()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!activeWebsite || !confirm('Silmek istediğinize emin misiniz?')) return
    await fetch(`/api/canned-responses?id=${id}&websiteId=${activeWebsite.websiteId}`, { method: 'DELETE' })
    fetchItems()
  }

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="cannedResponses" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Hazır Cevaplar</h1>
          <p className="text-sm text-muted-foreground mt-1">Inbox&apos;ta <code className="bg-muted px-1 rounded">/</code> yazarak kullanın</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Yeni Cevap</button>
      </div>

      {showForm && (
        <div className="surface p-5 mb-6 space-y-4">
          <input
            placeholder="Başlık"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Kısayol (örn: merhaba)"
              value={form.shortcut}
              onChange={(e) => setForm({ ...form, shortcut: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm"
            />
            <input
              placeholder="Kategori (isteğe bağlı)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm"
            />
          </div>
          <textarea
            placeholder="Mesaj içeriği"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm resize-none"
          />
          <button onClick={handleCreate} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      <div className="surface divide-y divide-border">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Henüz hazır cevap yok</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-4 flex justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-sm">{item.title}</p>
                {item.shortcut && (
                  <p className="text-xs text-primary mt-0.5">/{item.shortcut}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
              </div>
              <button onClick={() => handleDelete(item.id)} className="text-xs text-destructive shrink-0 hover:underline">
                Sil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
