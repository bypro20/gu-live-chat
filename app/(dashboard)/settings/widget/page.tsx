'use client'

import { useState, useEffect } from 'react'

export default function WidgetSettingsPage() {
  const [config, setConfig] = useState({
    primaryColor: '#6C3CE1',
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
  const [copiedCode, setCopiedCode] = useState(false)
  const [websiteId, setWebsiteId] = useState('')
  const [livePreviewOpen, setLivePreviewOpen] = useState(false)
  const [previewMessage, setPreviewMessage] = useState('')

  useEffect(() => {
    fetch('/api/websites')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.websites?.[0]?.websiteId) {
          setWebsiteId(data.websites[0].websiteId)
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Widget Ayarları</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Chat widget görünümünü ve davranışını özelleştirin</p>
      </div>

      <div className="space-y-8">
        {/* Preview + Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="space-y-6">
            {/* Color */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Görünüm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ana Renk</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-xl border-2 border-[#E5E0F0] dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="flex-1 px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pozisyon</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfig({ ...config, position: 'BOTTOM_RIGHT' })}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition font-medium text-sm ${
                        config.position === 'BOTTOM_RIGHT'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-[#E5E0F0] dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      ↓ Sağ Alt
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, position: 'BOTTOM_LEFT' })}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition font-medium text-sm ${
                        config.position === 'BOTTOM_LEFT'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-[#E5E0F0] dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      ↓ Sol Alt
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mesajlar</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hoş Geldin Mesajı</label>
                  <textarea
                    value={config.welcomeMessage}
                    onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Çevrimdışı Mesajı</label>
                  <textarea
                    value={config.offlineMessage}
                    onChange={(e) => setConfig({ ...config, offlineMessage: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Behavior */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Davranış</h3>
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
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Canlı Önizleme</h3>
              <div className="bg-[#EDE9FE] dark:bg-gray-700 rounded-2xl p-8 min-h-[500px] flex items-end justify-end relative">
                <div className="absolute top-4 left-4 text-xs text-gray-400">orneksite.com</div>

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
                  <div className="bg-[#F5F3FF] dark:bg-gray-800 p-4 space-y-3">
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
                  <div className="p-3 bg-white dark:bg-gray-900 border-t border-[#E5E0F0] dark:border-gray-700">
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2 bg-[#F5F3FF] dark:bg-gray-800 rounded-lg text-xs text-gray-400">Mesajınızı yazın...</div>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Widget Kurulumu</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Aşağıdaki kodu sitenizin <code className="bg-[#EDE9FE] dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">&lt;head&gt;</code> etiketinden önce ekleyin.
          </p>
          <div className="relative">
            <button
              onClick={() => {
                const code = `<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  $gu('set', 'WEBSITE_ID', '${websiteId || 'YOUR_WEBSITE_ID'}');
</script>
<script async src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"></script>`;
                navigator.clipboard.writeText(code).then(() => {
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
              <pre className="text-sm text-green-400">{`<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  $gu('set', 'WEBSITE_ID', '${websiteId || 'YOUR_WEBSITE_ID'}');
</script>
<script async src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"></script>`}</pre>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {saved ? '✓ Kaydedildi' : 'Kaydet'}
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
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition relative ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
            checked ? 'left-6.5' : 'left-0.5'
          }`}
          style={{ left: checked ? '26px' : '2px' }}
        />
      </button>
    </div>
  )
}