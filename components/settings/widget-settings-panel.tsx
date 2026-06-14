'use client'

import { useEffect, useState, useMemo } from 'react'
import { buildWidgetInstallSnippet } from '@/lib/widget-snippet'
import { WidgetLivePreview } from '@/components/widget/widget-live-preview'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import type { SettingsMessages } from '@/lib/settings-i18n'

export type WidgetConfigState = {
  primaryColor: string
  position: string
  welcomeMessage: string
  offlineMessage: string
  avatarUrl: string
  showPreChatForm: boolean
  requireName: boolean
  requireEmail: boolean
  soundEnabled: boolean
  autoOpen: boolean
  autoOpenDelay: number
}

export type WidgetWebsiteInfo = {
  id: string
  websiteId: string
  name: string
  domain?: string | null
  primaryColor?: string | null
  position?: string | null
  welcomeMessage?: string | null
  offlineMessage?: string | null
  avatarUrl?: string | null
  showPreChatForm?: boolean | null
  requireName?: boolean | null
  requireEmail?: boolean | null
}

function getDefaultConfig(w: SettingsMessages['widget']): WidgetConfigState {
  return {
    primaryColor: '#1972F5',
    position: 'BOTTOM_RIGHT',
    welcomeMessage: w.defaultWelcome,
    offlineMessage: w.defaultOffline,
    avatarUrl: '',
    showPreChatForm: false,
    requireName: false,
    requireEmail: false,
    soundEnabled: true,
    autoOpen: false,
    autoOpenDelay: 5,
  }
}

function configFromWebsite(website: WidgetWebsiteInfo, w: SettingsMessages['widget']): WidgetConfigState {
  const defaults = getDefaultConfig(w)
  return {
    primaryColor: website.primaryColor || defaults.primaryColor,
    position: website.position || defaults.position,
    welcomeMessage: website.welcomeMessage || defaults.welcomeMessage,
    offlineMessage: website.offlineMessage || defaults.offlineMessage,
    avatarUrl: website.avatarUrl || '',
    showPreChatForm: website.showPreChatForm ?? defaults.showPreChatForm,
    requireName: website.requireName ?? defaults.requireName,
    requireEmail: website.requireEmail ?? defaults.requireEmail,
    soundEnabled: defaults.soundEnabled,
    autoOpen: defaults.autoOpen,
    autoOpenDelay: defaults.autoOpenDelay,
  }
}

export function widgetConfigToPayload(config: WidgetConfigState) {
  return {
    primaryColor: config.primaryColor,
    position: config.position,
    welcomeMessage: config.welcomeMessage,
    offlineMessage: config.offlineMessage,
    avatarUrl: config.avatarUrl || null,
    showPreChatForm: config.showPreChatForm,
    requireName: config.requireName,
    requireEmail: config.requireEmail,
  }
}

type WidgetSettingsPanelProps = {
  website: WidgetWebsiteInfo | null
  onSave: (payload: ReturnType<typeof widgetConfigToPayload>) => Promise<void>
  showInstallSnippet?: boolean
  subtitle?: string
}

export function WidgetSettingsPanel({
  website,
  onSave,
  showInstallSnippet = true,
  subtitle,
}: WidgetSettingsPanelProps) {
  const i18n = useSettingsI18n()
  const { widget: w, common: c, locale } = i18n
  const quickLabels: [string, string, string] = locale === 'en'
    ? ['💬 Chat', '💰 Pricing', '🛟 Support']
    : ['💬 Sohbet', '💰 Fiyat', '🛟 Destek']
  const defaultConfig = useMemo(() => getDefaultConfig(w), [w])
  const [config, setConfig] = useState<WidgetConfigState>(defaultConfig)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    if (!website) return
    setConfig(configFromWebsite(website, w))
    setSaveError(null)
  }, [website, w])

  const handleSave = async () => {
    if (!website) {
      setSaveError(w.noSiteSelected)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(widgetConfigToPayload(config))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : c.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const installSnippet = buildWidgetInstallSnippet(website?.websiteId || '')

  if (!website) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        {w.selectSiteHint}
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {subtitle && (
        <p className="text-sm text-muted-foreground -mt-2">{subtitle}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-6">
          <div className="surface p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{w.appearance}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{w.primaryColor}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-12 h-12 shrink-0 rounded-xl border-2 border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{w.position}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, position: 'BOTTOM_RIGHT' })}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition font-medium text-sm cursor-pointer ${
                      config.position === 'BOTTOM_RIGHT'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-border-strong'
                    }`}
                  >
                    {w.bottomRight}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, position: 'BOTTOM_LEFT' })}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition font-medium text-sm cursor-pointer ${
                      config.position === 'BOTTOM_LEFT'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-border-strong'
                    }`}
                  >
                    {w.bottomLeft}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="surface p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{w.messages}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{w.welcomeMessage}</label>
                <textarea
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{w.offlineMessage}</label>
                <textarea
                  value={config.offlineMessage}
                  onChange={(e) => setConfig({ ...config, offlineMessage: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="surface p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{w.behavior}</h3>
            <div className="space-y-4">
              <ToggleField
                label={w.preChatForm}
                description={w.preChatFormDesc}
                checked={config.showPreChatForm}
                onChange={(checked) => setConfig({ ...config, showPreChatForm: checked })}
              />
              {config.showPreChatForm && (
                <>
                  <ToggleField
                    label={w.requireName}
                    description={w.requireNameDesc}
                    checked={config.requireName}
                    onChange={(checked) => setConfig({ ...config, requireName: checked })}
                  />
                  <ToggleField
                    label={w.requireEmail}
                    description={w.requireEmailDesc}
                    checked={config.requireEmail}
                    onChange={(checked) => setConfig({ ...config, requireEmail: checked })}
                  />
                </>
              )}
              <ToggleField
                label={w.soundNotifications}
                description={w.soundNotificationsDesc}
                checked={config.soundEnabled}
                onChange={(checked) => setConfig({ ...config, soundEnabled: checked })}
              />
              <ToggleField
                label={w.autoOpen}
                description={w.autoOpenDesc}
                checked={config.autoOpen}
                onChange={(checked) => setConfig({ ...config, autoOpen: checked })}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{w.livePreview}</h3>
            <WidgetLivePreview
              primaryColor={config.primaryColor}
              websiteName={website.name}
              domain={website.domain}
              welcomeMessage={config.welcomeMessage}
              onlineLabel={w.online}
              typeMessageLabel={w.typeMessage}
              quickLabels={quickLabels}
            />
          </div>
        </div>
      </div>

      {showInstallSnippet && (
        <div className="surface p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">{w.install}</h3>
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
            <p className="font-medium text-foreground">
              {w.installHint(website.name)}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mt-2 break-all">
              WEBSITE_ID: {website.websiteId}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(installSnippet).then(() => {
                  setCopiedCode(true)
                  setTimeout(() => setCopiedCode(false), 2000)
                })
              }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all z-10 bg-white text-gray-800 hover:bg-gray-100 shadow-md cursor-pointer"
            >
              {copiedCode ? w.copied : w.copy}
            </button>
            <div className="bg-[#1A1D2E] rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 whitespace-pre">{installSnippet}</pre>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        {saveError && <p className="text-sm text-destructive sm:mr-auto">{saveError}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${saved ? '!bg-success' : ''}`}
        >
          {saving ? c.saving : saved ? c.saved : c.save}
        </button>
      </div>
    </div>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 shrink-0 rounded-full transition-colors relative cursor-pointer ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
          style={{ left: checked ? '26px' : '2px' }}
        />
      </button>
    </div>
  )
}
