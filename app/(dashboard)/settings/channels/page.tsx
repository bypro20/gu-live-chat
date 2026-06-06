'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

interface ChannelIntegration {
  id: string
  type: 'WHATSAPP' | 'EMAIL' | 'MESSENGER' | 'INSTAGRAM' | 'TELEGRAM' | 'SLACK' | 'SMS'
  name: string
  isActive: boolean
  config: string | null
  lastSyncAt: string | null
}

const CHANNEL_DEFS: Record<string, { label: string; icon: string; color: string; description: string }> = {
  WHATSAPP: { label: 'WhatsApp', icon: '💬', color: '#25D366', description: 'WhatsApp Business API entegrasyonu' },
  EMAIL: { label: 'E-posta', icon: '✉️', color: '#1972F5', description: 'E-posta kanalı (SMTP/IMAP)' },
  MESSENGER: { label: 'Facebook Messenger', icon: '💠', color: '#0084FF', description: 'Facebook Messenger entegrasyonu' },
  INSTAGRAM: { label: 'Instagram', icon: '📷', color: '#E4405F', description: 'Instagram DM entegrasyonu' },
  TELEGRAM: { label: 'Telegram', icon: '✈️', color: '#0088CC', description: 'Telegram Bot entegrasyonu' },
  SLACK: { label: 'Slack', icon: '#️⃣', color: '#4A154B', description: 'Slack entegrasyonu' },
  SMS: { label: 'SMS', icon: '📱', color: '#F97316', description: 'Twilio SMS entegrasyonu' },
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
  SMS: [
    { key: 'accountSid', label: 'Twilio Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxx' },
    { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Twilio Auth Token' },
    { key: 'phoneNumber', label: 'Telefon Numarası', type: 'text', placeholder: '+901234567890' },
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Kanallar</h1>
        <p className="text-sm text-muted-foreground mt-1">Çoklu kanal iletişim entegrasyonlarını yönetin</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CHANNEL_DEFS).map(([type, def]) => {
            const channel = getChannel(type)
            const connected = channel?.isActive ?? false

            return (
              <div key={type} className="surface surface-hover p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${def.color}15` }}
                    >
                      {def.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{def.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{def.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className={`text-xs font-medium ${connected ? 'text-success' : 'text-muted-foreground'}`}>
                      {connected ? 'Bağlı' : 'Bağlı Değil'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openConfig(channel, type)}
                      className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-accent transition"
                    >
                      Yapılandır
                    </button>
                    <button
                      onClick={() => handleToggle(channel, type)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${connected ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setConfigModal(null)}>
          <div className="surface shadow-xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {CHANNEL_DEFS[configModal.type]?.label} Yapılandırma
              </h3>
              <button onClick={() => setConfigModal(null)} className="p-1 text-muted-foreground hover:text-foreground transition shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {(CONFIG_FIELDS[configModal.type] || []).map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={configForm[field.key] || ''}
                    onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => setConfigModal(null)} className="btn-secondary">İptal</button>
              <button onClick={saveConfig} className="btn-primary">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
