'use client'

import { useState, useEffect } from 'react'
import { useWebsite } from '@/lib/hooks/use-website'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'

export function GeneralSettingsPanel({ compact = false }: { compact?: boolean }) {
  const { website, isLoading, updateWebsite } = useWebsite()
  const { general: t, common } = useSettingsI18n()
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
      setMessage({ type: 'error', text: t.nameRequired })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await updateWebsite({ name: name.trim(), domain: domain.trim() })
      setMessage({ type: 'success', text: t.savedSuccess })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : common.saveFailed })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={compact ? 'p-4' : 'p-4 sm:p-6 lg:p-8 max-w-3xl'}>
      {!compact && (
        <div className="mb-6 sm:mb-8">
          <h1 className="app-page-title">{t.pageTitle}</h1>
          <p className="app-page-subtitle">{t.pageSubtitle}</p>
        </div>
      )}

      <div className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t.sectionTitle}</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.websiteName}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="native-input"
                placeholder={t.websiteNamePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.websiteDomain}</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="native-input"
                placeholder={t.domainPlaceholder}
              />
            </div>

            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-success-light text-success'
                    : 'bg-destructive-light text-destructive'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="btn-primary w-full sm:w-auto justify-center min-h-[48px] px-6"
            >
              {saving ? common.saving : common.save}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
