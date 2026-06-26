'use client'

import { useEffect, useState } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import {
  WidgetSettingsPanel,
  widgetConfigToPayload,
  type WidgetWebsiteInfo,
} from '@/components/settings/widget-settings-panel'

export default function WidgetSettingsPage() {
  const i18n = useSettingsI18n()
  const { widget: w, common } = i18n
  const { activeWebsite, refreshWebsites } = useActiveWebsite()
  const [website, setWebsite] = useState<WidgetWebsiteInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeWebsite?.websiteId) {
      setWebsite(null)
      return
    }
    setLoading(true)
    fetch(`/api/websites/${activeWebsite.websiteId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || common.connectionError)
        setWebsite({
          id: data.id,
          websiteId: data.websiteId,
          name: data.name,
          domain: data.domain,
          primaryColor: data.primaryColor,
          position: data.position,
          welcomeMessage: data.welcomeMessage,
          offlineMessage: data.offlineMessage,
          avatarUrl: data.avatarUrl,
          agentDisplayName: data.agentDisplayName,
          agentTitle: data.agentTitle,
          showPreChatForm: data.showPreChatForm,
          requireName: data.requireName,
          requireEmail: data.requireEmail,
        })
      })
      .catch(() => setWebsite(null))
      .finally(() => setLoading(false))
  }, [activeWebsite?.websiteId, activeWebsite?.id, common.connectionError])

  const handleSave = async (payload: ReturnType<typeof widgetConfigToPayload>) => {
    if (!activeWebsite) throw new Error(w.noActiveSite)
    const res = await fetch(`/api/websites/${activeWebsite.websiteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || common.saveFailed)
    setWebsite((prev) =>
      prev
        ? {
            ...prev,
            ...payload,
          }
        : prev
    )
    refreshWebsites()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{w.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{w.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <WidgetSettingsPanel
          website={website}
          onSave={handleSave}
          subtitle={website ? w.subtitleForSite(website.name) : undefined}
        />
      )}
    </div>
  )
}
