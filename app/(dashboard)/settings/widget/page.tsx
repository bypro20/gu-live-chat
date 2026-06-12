'use client'

import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import {
  WidgetSettingsPanel,
  widgetConfigToPayload,
} from '@/components/settings/widget-settings-panel'

export default function WidgetSettingsPage() {
  const i18n = useSettingsI18n()
  const { widget: w } = i18n
  const { activeWebsite, refreshWebsites } = useActiveWebsite()

  const handleSave = async (payload: ReturnType<typeof widgetConfigToPayload>) => {
    if (!activeWebsite) throw new Error(w.noActiveSite)
    const res = await fetch(`/api/websites/${activeWebsite.websiteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || i18n.common.saveFailed)
    }
    refreshWebsites()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{w.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{w.subtitle}</p>
      </div>

      <WidgetSettingsPanel
        website={
          activeWebsite
            ? {
                id: activeWebsite.id,
                websiteId: activeWebsite.websiteId,
                name: activeWebsite.name,
                domain: activeWebsite.domain,
                primaryColor: activeWebsite.primaryColor,
                position: activeWebsite.position,
                welcomeMessage: activeWebsite.welcomeMessage,
                offlineMessage: activeWebsite.offlineMessage,
                avatarUrl: activeWebsite.avatarUrl,
                showPreChatForm: activeWebsite.showPreChatForm,
                requireName: activeWebsite.requireName,
                requireEmail: activeWebsite.requireEmail,
              }
            : null
        }
        onSave={handleSave}
        subtitle={
          activeWebsite ? w.subtitleForSite(activeWebsite.name) : undefined
        }
      />
    </div>
  )
}
