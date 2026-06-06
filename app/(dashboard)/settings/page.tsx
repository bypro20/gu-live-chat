'use client'

import { useState, useEffect } from 'react'
import { useWebsite } from '@/lib/hooks/use-website'

export default function SettingsPage() {
  const { website, isLoading, updateWebsite } = useWebsite()
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (website) {
      setName(website.name || '')
      setDomain(website.domain || '')
    }
  }, [website])

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Website adı boş olamaz' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await updateWebsite({ name: name.trim(), domain: domain.trim() })
      setMessage({ type: 'success', text: 'Ayarlar kaydedildi!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kaydetme başarısız' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Ayarlar</h1>
        <p className="text-sm text-muted-foreground mt-1">Web sitenizin temel bilgilerini yönetin</p>
      </div>

      <div className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Genel Ayarlar</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Website Adı
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Web sitenizin adı"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Website Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="orneksite.com"
              />
            </div>

            {message && (
              <div className={`px-4 py-2.5 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-success-light text-success'
                  : 'bg-destructive-light text-destructive'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}