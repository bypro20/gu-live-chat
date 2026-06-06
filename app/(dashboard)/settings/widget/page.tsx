'use client'

import { useState, useEffect } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org'

function buildInstallSnippet(websiteId: string) {
  return `<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  window.GU_WIDGET_URL = '${APP_URL}';
  $gu('set', 'WEBSITE_ID', '${websiteId || 'WEBSITE_ID'}');
</script>
<script async src="${APP_URL}/widget.js"></script>`
}

export default function WidgetSettingsPage() {
  const { activeWebsite } = useActiveWebsite()
  const [config, setConfig] = useState({
    primaryColor: '#1972F5',
    position: 'BOTTOM_RIGHT',
    welcomeMessage: 'Merhaba! Size nasıl yardımcı olabiliriz?',
    offlineMessage: 'Şu an çevrimdışısınız. Bir mesaj bırakın, size dönelim.',
    avatarUrl: '',
    showPreChatForm: true,
    requireName: true,
    requireEmail: true,
    soundEnabled: true,
    autoOpen: false,
    autoOpenDelay: 5,
  })

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const websiteId = activeWebsite?.websiteId || ''

  useEffect(() => {
    if (!activeWebsite) return
    setConfig((prev) => ({
      ...prev,
      primaryColor: activeWebsite.primaryColor || prev.primaryColor,
      position: activeWebsite.position || prev.position,
      welcomeMessage: activeWebsite.welcomeMessage || prev.welcomeMessage,
      offlineMessage: activeWebsite.offlineMessage || prev.offlineMessage,
      avatarUrl: activeWebsite.avatarUrl || prev.avatarUrl,
    }))
  }, [activeWebsite])

  const handleSave = async () => {
    if (!activeWebsite) {
      setSaveError('Aktif web sitesi bulunamadı')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/websites/${activeWebsite.websiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor: config.primaryColor,
          position: config.position,
          welcomeMessage: config.welcomeMessage,
          offlineMessage: config.offlineMessage,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Kaydetme başarısız')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Kaydetme başarısız')
    } finally {
      setSaving(false)
    }
  }

  const installSnippet = buildInstallSnippet(websiteId)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Widget Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-1">Chat widget görünümünü ve davranışını özelleştirin</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Preview + Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Settings */}
          <div className="space-y-6">
            {/* Color */}
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
                      onClick={() => setConfig({ ...config, position: 'BOTTOM_RIGHT' })}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition font-medium text-sm ${
                        config.position === 'BOTTOM_RIGHT'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-border-strong'
                      }`}
                    >
                      ↓ Sağ Alt
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, position: 'BOTTOM_LEFT' })}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition font-medium text-sm ${
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

            {/* Messages */}
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

            {/* Behavior */}
            <div className="surface p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Davranış</h3>
              <div className="space-y-4">
                <ToggleField
                  label="Sohbet öncesi form"
                  description="Ziyaretçilerden isim ve e-posta bilgilerini toplayın"
                  checked={config.showPreChatForm}
                  onChange={(checked) => setConfig({ ...config, showPreChatForm: checked })}
                />
                <ToggleField
                  label="Ses bildirimleri"
                  description="Yeni mesaj geldiğinde ses çalsın"
                  checked={config.soundEnabled}
                  onChange={(checked) => setConfig({ ...config, soundEnabled: checked })}
                />
                <ToggleField
                  label="Otomatik açılma"
                  description="Sayfa yüklendikten sonra widget otomatik açılsın"
                  checked={config.autoOpen}
                  onChange={(checked) => setConfig({ ...config, autoOpen: checked })}
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Canlı Önizleme</h3>
              <div className="bg-muted rounded-2xl p-8 min-h-[500px] flex items-end justify-end relative">
                <div className="absolute top-4 left-4 text-xs text-muted-foreground">orneksite.com</div>

                {/* Chat Widget Preview */}
                <div className="w-[340px] rounded-2xl overflow-hidden shadow-xl" style={{ marginBottom: '20px' }}>
                  {/* Header */}
                  <div className="p-4 flex items-center gap-3" style={{ background: config.primaryColor }}>
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Destek Ekibi</p>
                      <p className="text-white/70 text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Çevrimiçi
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="bg-[#EFF6FF] dark:bg-gray-800 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: config.primaryColor + '15' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={config.primaryColor} strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-xl rounded-tl-none p-3 max-w-[220px] shadow-sm text-sm text-gray-900 dark:text-white">
                        {config.welcomeMessage}
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-3 bg-white dark:bg-gray-900 border-t border-[#E5E7EB] dark:border-gray-700">
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2 bg-[#EFF6FF] dark:bg-gray-800 rounded-lg text-xs text-gray-400">Mesajınızı yazın...</div>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: config.primaryColor }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Bubble */}
                <div className="absolute bottom-4 right-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer" style={{ background: config.primaryColor }}>
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Code */}
        <div className="surface p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Widget Kurulumu</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Aşağıdaki kodu sitenizin <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">&lt;head&gt;</code> etiketinden önce ekleyin.
          </p>
          <div className="relative">
            <button
              onClick={() => {
                navigator.clipboard.writeText(installSnippet).then(() => {
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                });
              }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all z-10 bg-white text-gray-800 hover:bg-gray-100 shadow-md hover:shadow-lg"
            >
              {copiedCode ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-600">Kopyalandı!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Kopyala</span>
                </>
              )}
            </button>
            <div className="bg-[#1A1D2E] rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 whitespace-pre">{installSnippet}</pre>
            </div>
          </div>
          {!websiteId && (
            <p className="text-xs text-muted-foreground mt-3">
              Web sitesi kimliği yükleniyor… Kod hazır olduğunda <code className="bg-muted px-1 rounded font-mono">WEBSITE_ID</code> otomatik dolacaktır.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          {saveError && (
            <p className="text-sm text-destructive sm:mr-auto">{saveError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${saved ? '!bg-success' : ''}`}
          >
            {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToggleField({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 shrink-0 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
          style={{ left: checked ? '26px' : '2px' }}
        />
      </button>
    </div>
  )
}