'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'

interface PrivacySettings {
  showConsentBanner: boolean
  consentBannerText: string
  cookieConsentEnabled: boolean
  cookieConsentText: string
  privacyPolicyUrl: string
  visitorDataDays: number
  sessionDataDays: number
  chatHistoryDays: number
  autoDelete: boolean
}

export default function PrivacySettingsPage() {
  const { activeWebsite } = useActiveWebsite()
  const { privacy: t, common, dateLocale } = useSettingsI18n()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState<PrivacySettings>({
    showConsentBanner: true,
    consentBannerText: t.defaultConsentBannerText,
    cookieConsentEnabled: true,
    cookieConsentText: t.defaultCookieConsentText,
    privacyPolicyUrl: '',
    visitorDataDays: 365,
    sessionDataDays: 90,
    chatHistoryDays: 730,
    autoDelete: false,
  })

  const fetchSettings = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/privacy?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setSettings({
            showConsentBanner: data.showConsentBanner ?? true,
            consentBannerText: data.consentBannerText || t.defaultConsentBannerText,
            cookieConsentEnabled: data.cookieConsentEnabled ?? true,
            cookieConsentText: data.cookieConsentText || t.defaultCookieConsentText,
            privacyPolicyUrl: data.privacyPolicyUrl || '',
            visitorDataDays: data.retentionPolicy?.visitorDataDays ?? 365,
            sessionDataDays: data.retentionPolicy?.sessionDataDays ?? 90,
            chatHistoryDays: data.retentionPolicy?.chatHistoryDays ?? 730,
            autoDelete: data.retentionPolicy?.autoDelete ?? false,
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch privacy settings', err)
    } finally {
      setLoading(false)
    }
  }, [activeWebsite, t.defaultConsentBannerText, t.defaultCookieConsentText])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch('/api/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: activeWebsite.websiteId,
          showConsentBanner: settings.showConsentBanner,
          consentBannerText: settings.consentBannerText,
          cookieConsentEnabled: settings.cookieConsentEnabled,
          cookieConsentText: settings.cookieConsentText,
          privacyPolicyUrl: settings.privacyPolicyUrl,
          visitorDataDays: settings.visitorDataDays,
          sessionDataDays: settings.sessionDataDays,
          chatHistoryDays: settings.chatHistoryDays,
          autoDelete: settings.autoDelete,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save privacy settings', err)
    }
  }

  const handleDownloadDPA = () => {
    const content = t.buildDpaContent({
      websiteName: activeWebsite?.name || 'Website',
      visitorDataDays: settings.visitorDataDays,
      sessionDataDays: settings.sessionDataDays,
      chatHistoryDays: settings.chatHistoryDays,
      date: new Date().toLocaleDateString(dateLocale),
    })
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.dpaFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      <div className="space-y-6">
        <div className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t.consentBannerTitle}</h3>
            <button
              onClick={() => setSettings({ ...settings, showConsentBanner: !settings.showConsentBanner })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${settings.showConsentBanner ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.showConsentBanner ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t.consentBannerDesc}</p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t.bannerTextLabel}</label>
            <textarea
              value={settings.consentBannerText}
              onChange={(e) => setSettings({ ...settings, consentBannerText: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t.cookieConsentTitle}</h3>
            <button
              onClick={() => setSettings({ ...settings, cookieConsentEnabled: !settings.cookieConsentEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${settings.cookieConsentEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.cookieConsentEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t.cookieTextLabel}</label>
            <textarea
              value={settings.cookieConsentText}
              onChange={(e) => setSettings({ ...settings, cookieConsentText: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="surface p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t.privacyPolicyTitle}</h3>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t.privacyPolicyUrlLabel}</label>
            <input
              type="url"
              value={settings.privacyPolicyUrl}
              onChange={(e) => setSettings({ ...settings, privacyPolicyUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder={t.privacyPolicyUrlPlaceholder}
            />
          </div>
        </div>

        <div className="surface p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t.dataRetentionTitle}</h3>
          <p className="text-sm text-muted-foreground mb-6">{t.dataRetentionDesc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t.visitorDataDays}</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={settings.visitorDataDays}
                onChange={(e) => setSettings({ ...settings, visitorDataDays: parseInt(e.target.value) || 365 })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t.sessionDataDays}</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={settings.sessionDataDays}
                onChange={(e) => setSettings({ ...settings, sessionDataDays: parseInt(e.target.value) || 90 })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t.chatHistoryDays}</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={settings.chatHistoryDays}
                onChange={(e) => setSettings({ ...settings, chatHistoryDays: parseInt(e.target.value) || 730 })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{t.autoDelete}</p>
              <p className="text-xs text-muted-foreground">{t.autoDeleteDesc}</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoDelete: !settings.autoDelete })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${settings.autoDelete ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.autoDelete ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="surface p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.dpaTitle}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t.dpaDesc}</p>
          <button
            onClick={handleDownloadDPA}
            className="btn-secondary"
          >
            {t.downloadDpa}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`btn-primary w-full sm:w-auto ${saved ? '!bg-success' : ''}`}
          >
            {saved ? common.saved : common.save}
          </button>
        </div>
      </div>
    </div>
  )
}
