'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

interface ChannelIntegration {
  id: string
  type: 'WHATSAPP' | 'EMAIL' | 'MESSENGER' | 'INSTAGRAM' | 'TELEGRAM' | 'SLACK'
  name: string
  isActive: boolean
  config: string | null
  lastSyncAt: string | null
}

const CHANNEL_DEFS: Record<string, { label: string; icon: string; color: string; description: string }> = {
  WHATSAPP: { label: 'WhatsApp', icon: '💬', color: '#25D366', description: 'WhatsApp Business API entegrasyonu' },
  EMAIL: { label: 'E-posta', icon: '✉️', color: '#6C3CE1', description: 'E-posta kanalı (SMTP/IMAP)' },
  MESSENGER: { label: 'Facebook Messenger', icon: '💠', color: '#0084FF', description: 'Facebook Messenger entegrasyonu' },
  INSTAGRAM: { label: 'Instagram', icon: '📷', color: '#E4405F', description: 'Instagram DM entegrasyonu' },
  TELEGRAM: { label: 'Telegram', icon: '✈️', color: '#0088CC', description: 'Telegram Bot entegrasyonu' },
  SLACK: { label: 'Slack', icon: '#️⃣', color: '#4A154B', description: 'Slack entegrasyonu' },
}

const CONFIG_FIELDS: Record<string, { key: string; label: string; type: string; placeholder: string }[]> = {
  WHATSAPP: [
    { key: 'phoneNumberId', label: 'Telefon Numarası ID', type: 'text', placeholder: 'WhatsApp Business Phone ID' },
    { key: 'accessToken', label: 'Erişim Tokeni', type: 'password', placeholder: 'WhatsApp Access Token' },
  ],
  EMAIL: [
    { key: 'smtpHost', label: 'SMTP Sunucusu', type: 'text', placeholder: 'smtp.ornek.com' },
    { key: 'smtpPort', label: 'SMTP Port', type: 'text', placeholder: '587' },
    { key: 'smtpUser', label: 'SMTP Kullanıcı', type: 'text', placeholder: 'kullanici@ornek.com' },
    { key: 'smtpPass', label: 'SMTP Şifre', type: 'password', placeholder: 'SMTP şifresi' },
  ],
  MESSENGER: [
    { key: 'pageId', label: 'Sayfa ID', type: 'text', placeholder: 'Facebook Sayfa ID' },
    { key: 'pageAccessToken', label: 'Sayfa Erişim Tokeni', type: 'password', placeholder: 'Page Access Token' },
  ],
  INSTAGRAM: [
    { key: 'businessAccountId', label: 'İşletme Hesabı ID', type: 'text', placeholder: 'Instagram Business Account ID' },
    { key: 'accessToken', label: 'Erişim Tokeni', type: 'password', placeholder: 'Instagram Access Token' },
  ],
  TELEGRAM: [
    { key: 'botToken', label: 'Bot Tokeni', type: 'password', placeholder: 'Telegram Bot Token' },
  ],
  SLACK: [
    { key: 'botToken', label: 'Bot Tokeni', type: 'password', placeholder: 'xoxb-...' },
    { key: 'signingSecret', label: 'İmza Sırrı', type: 'password', placeholder: 'Signing Secret' },
  ],
}

export default function ChannelsPage() {
  const { activeWebsite } = useActiveWebsite()
  const [channels, setChannels] = useState<ChannelIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [configModal, setConfigModal] = useState<{ channel: ChannelIntegration | null; type: string } | null>(null)
  const [configForm, setConfigForm] = useState<Record<string, string>>({})

  const fetchChannels = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/channels?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) setChannels(await res.json())
    } catch (err) {
      console.error('Failed to fetch channels', err)
    } finally {
      setLoading(false)
    }
  }, [activeWebsite])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  const getChannel = (type: string) => channels.find((c) => c.type === type)

  const handleToggle = async (channel: ChannelIntegration | undefined, type: string) => {
    if (channel) {
      await fetch('/api/channels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: channel.id, isActive: !channel.isActive }),
      })
    } else if (activeWebsite) {
      const def = CHANNEL_DEFS[type]
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite.websiteId, type, name: def.label, isActive: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Kanal eklenemedi')
      }
    }
    fetchChannels()
  }

  const openConfig = (channel: ChannelIntegration | undefined, type: string) => {
    const parsed = channel?.config ? JSON.parse(channel.config) : {}
    setConfigForm(parsed)
    setConfigModal({ channel: channel || null, type })
  }

  const saveConfig = async () => {
    if (!configModal) return
    const { channel, type } = configModal
    const configStr = JSON.stringify(configForm)

    if (channel) {
      await fetch('/api/channels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: channel.id, config: configStr }),
      })
    } else if (activeWebsite) {
      const def = CHANNEL_DEFS[type]
      await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite.websiteId, type, name: def.label, config: configStr }),
      })
    }
    setConfigModal(null)
    fetchChannels()
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kanallar</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Çoklu kanal iletişim entegrasyonlarını yönetin</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CHANNEL_DEFS).map(([type, def]) => {
            const channel = getChannel(type)
            const connected = channel?.isActive ?? false

            return (
              <div key={type} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${def.color}15` }}
                    >
                      {def.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{def.label}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{def.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E5E0F0] dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className={`text-xs font-medium ${connected ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {connected ? 'Bağlı' : 'Bağlı Değil'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openConfig(channel, type)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#EDE9FE] dark:bg-gray-700 text-[#4A2080] dark:text-gray-300 rounded-lg hover:bg-[#E5E0F0] dark:hover:bg-gray-600 transition"
                    >
                      Yapılandır
                    </button>
                    <button
                      onClick={() => handleToggle(channel, type)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${connected ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${connected ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {configModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setConfigModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-[#E5E0F0] dark:border-gray-700 p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {CHANNEL_DEFS[configModal.type]?.label} Yapılandırma
              </h3>
              <button onClick={() => setConfigModal(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {(CONFIG_FIELDS[configModal.type] || []).map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={configForm[field.key] || ''}
                    onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setConfigModal(null)} className="px-4 py-2.5 bg-[#EDE9FE] dark:bg-gray-700 text-[#4A2080] dark:text-gray-300 font-medium rounded-xl transition">İptal</button>
              <button onClick={saveConfig} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
