'use client'

import { useEffect, useState } from 'react'
import { buildWidgetInstallSnippet } from '@/lib/widget-snippet'

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

const DEFAULT_CONFIG: WidgetConfigState = {
  primaryColor: '#1972F5',
  position: 'BOTTOM_RIGHT',
  welcomeMessage: 'Merhaba! Size nasıl yardımcı olabiliriz?',
  offlineMessage: 'Şu an çevrimdışısınız. Bir mesaj bırakın, size dönelim.',
  avatarUrl: '',
  showPreChatForm: false,
  requireName: true,
  requireEmail: true,
  soundEnabled: true,
  autoOpen: false,
  autoOpenDelay: 5,
}

function configFromWebsite(website: WidgetWebsiteInfo): WidgetConfigState {
  return {
    primaryColor: website.primaryColor || DEFAULT_CONFIG.primaryColor,
    position: website.position || DEFAULT_CONFIG.position,
    welcomeMessage: website.welcomeMessage || DEFAULT_CONFIG.welcomeMessage,
    offlineMessage: website.offlineMessage || DEFAULT_CONFIG.offlineMessage,
    avatarUrl: website.avatarUrl || '',
    showPreChatForm: website.showPreChatForm ?? DEFAULT_CONFIG.showPreChatForm,
    requireName: website.requireName ?? DEFAULT_CONFIG.requireName,
    requireEmail: website.requireEmail ?? DEFAULT_CONFIG.requireEmail,
    soundEnabled: DEFAULT_CONFIG.soundEnabled,
    autoOpen: DEFAULT_CONFIG.autoOpen,
    autoOpenDelay: DEFAULT_CONFIG.autoOpenDelay,
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
  const [config, setConfig] = useState<WidgetConfigState>(DEFAULT_CONFIG)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    if (!website) return
    setConfig(configFromWebsite(website))
    setSaveError(null)
  }, [website])

  const handleSave = async () => {
    if (!website) {
      setSaveError('Site seçilmedi')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(widgetConfigToPayload(config))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Kaydetme başarısız')
    } finally {
      setSaving(false)
    }
  }

  const installSnippet = buildWidgetInstallSnippet(website?.websiteId || '')

  if (!website) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Widget ayarları için bir site seçin.
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
            <h3 className="text-lg font-semibold text-foreground mb-4">Görünüm</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ana Renk</label>
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
                <label className="block text-sm font-medium text-foreground mb-2">Pozisyon</label>
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
                    ↓ Sağ Alt
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
                    ↓ Sol Alt
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="surface p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Mesajlar</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hoş Geldin Mesajı</label>
                <textarea
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Çevrimdışı Mesajı</label>
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
            <h3 className="text-lg font-semibold text-foreground mb-4">Davranış</h3>
            <div className="space-y-4">
              <ToggleField
                label="Sohbet öncesi form"
                description="Ziyaretçilerden isim ve e-posta bilgilerini toplayın"
                checked={config.showPreChatForm}
                onChange={(checked) => setConfig({ ...config, showPreChatForm: checked })}
              />
              {config.showPreChatForm && (
                <>
                  <ToggleField
                    label="İsim zorunlu"
                    description="Formda isim alanı zorunlu olsun"
                    checked={config.requireName}
                    onChange={(checked) => setConfig({ ...config, requireName: checked })}
                  />
                  <ToggleField
                    label="E-posta zorunlu"
                    description="Formda e-posta alanı zorunlu olsun"
                    checked={config.requireEmail}
                    onChange={(checked) => setConfig({ ...config, requireEmail: checked })}
                  />
                </>
              )}
              <ToggleField
                label="Ses bildirimleri"
                description="Ziyaretçi tarafında yeni mesaj sesi (yakında)"
                checked={config.soundEnabled}
                onChange={(checked) => setConfig({ ...config, soundEnabled: checked })}
              />
              <ToggleField
                label="Otomatik açılma"
                description="Sayfa yüklendikten sonra widget otomatik açılsın (yakında)"
                checked={config.autoOpen}
                onChange={(checked) => setConfig({ ...config, autoOpen: checked })}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Canlı Önizleme</h3>
            <div className="bg-muted rounded-2xl p-8 min-h-[500px] flex items-end justify-end relative">
              <div className="absolute top-4 left-4 text-xs text-muted-foreground">
                {website.domain || website.name}
              </div>

              <div className="w-[340px] rounded-2xl overflow-hidden shadow-xl" style={{ marginBottom: '20px' }}>
                <div className="p-4 flex items-center gap-3" style={{ background: config.primaryColor }}>
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{website.name}</p>
                    <p className="text-white/70 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Çevrimiçi
                    </p>
                  </div>
                </div>

                <div className="bg-[#EFF6FF] dark:bg-gray-800 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: config.primaryColor + '15' }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={config.primaryColor} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-xl rounded-tl-none p-3 max-w-[220px] shadow-sm text-sm text-gray-900 dark:text-white">
                      {config.welcomeMessage}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-gray-900 border-t border-[#E5E7EB] dark:border-gray-700">
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-[#EFF6FF] dark:bg-gray-800 rounded-lg text-xs text-gray-400">
                      Mesajınızı yazın...
                    </div>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white cursor-pointer"
                      style={{ background: config.primaryColor }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 right-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                  style={{ background: config.primaryColor }}
                >
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInstallSnippet && (
        <div className="surface p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Widget Kurulumu</h3>
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
            <p className="font-medium text-foreground">
              Bu kod yalnızca <span className="text-primary">{website.name}</span> sitesine aittir.
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
              {copiedCode ? '✓ Kopyalandı!' : 'Kopyala'}
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
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
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
