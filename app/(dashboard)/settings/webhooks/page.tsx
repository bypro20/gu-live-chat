'use client'

import { useState } from 'react'

interface WebhookEvent {
  id: string
  event: string
}

interface Webhook {
  id: string
  url: string
  isActive: boolean
  secret: string
  events: WebhookEvent[]
  lastTriggeredAt: string | null
  failureCount: number
}

const AVAILABLE_EVENTS = [
  'conversation.created',
  'conversation.resolved',
  'conversation.closed',
  'message.sent',
  'message.received',
  'visitor.created',
  'visitor.updated',
  'team.member.added',
  'team.member.removed',
]

export default function WebhooksPage() {
  const [webhooks] = useState<Webhook[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhook&apos;lar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Dış sistemlere gerçek zamanlı bildirimler gönderin</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition"
        >
          + Webhook Ekle
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Webhook</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="https://ornek.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Olaylar</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2 bg-[#EFF6FF] dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-[#EFF6FF] dark:hover:bg-gray-700 transition">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, event])
                        } else {
                          setSelectedEvents(selectedEvents.filter((ev) => ev !== event))
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-[#EFF6FF] dark:bg-gray-700 text-[#1E40AF] dark:text-gray-300 font-medium rounded-xl transition">
              İptal
            </button>
            <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition">
              Oluştur
            </button>
          </div>
        </div>
      )}

      {/* Webhook List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-gray-700">
        {webhooks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🔗
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Henüz webhook yok</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Webhook ekleyerek dış sistemlere gerçek zamanlı bildirimler gönderin
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{webhook.url}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {webhook.events.map((event) => (
                      <span key={event.id} className="px-2 py-0.5 bg-[#EFF6FF] dark:bg-gray-700 text-[#1E40AF] dark:text-gray-400 text-xs rounded">
                        {event.event}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${webhook.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-[#EFF6FF] text-[#1E40AF] dark:bg-gray-700 dark:text-gray-400'}`}>
                    {webhook.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-[#1972F5]/10 dark:bg-blue-900/20 rounded-2xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-[#1972F5] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-[#1E40AF] dark:text-blue-400">Webhook güvenliği</p>
          <p className="text-xs text-[#1E40AF]/80 dark:text-blue-400/70 mt-0.5">Her webhook isteği, webhook sırrınız ile imzalanır. İstek doğrulamak için <code className="bg-[#1972F5]/10 dark:bg-blue-900/50 px-1 rounded">X-Gu-Signature</code> header değerini kullanın.</p>
        </div>
      </div>
    </div>
  )
}