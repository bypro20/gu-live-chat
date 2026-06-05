'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

interface Campaign {
  id: string
  name: string
  description: string | null
  type: 'EMAIL' | 'IN_APP' | 'BROADCAST'
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  target: string
  subject: string | null
  content: string | null
  scheduledAt: string | null
  sentCount: number
  openCount: number
  clickCount: number
  replyCount: number
  createdAt: string
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: 'Taslak',
  ACTIVE: 'Aktif',
  PAUSED: 'Duraklatıldı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TYPE_MAP: Record<string, string> = {
  EMAIL: 'E-posta',
  IN_APP: 'Uygulama İçi',
  BROADCAST: 'Toplu Mesaj',
}

const TYPE_COLORS: Record<string, string> = {
  EMAIL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  IN_APP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BROADCAST: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function CampaignsPage() {
  const { activeWebsite } = useActiveWebsite()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', type: 'EMAIL' as Campaign['type'],
    subject: '', content: '', target: 'ALL_VISITORS', scheduledAt: '',
  })

  const fetchCampaigns = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/campaigns?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) setCampaigns(await res.json())
    } catch (err) {
      console.error('Failed to fetch campaigns', err)
    } finally {
      setLoading(false)
    }
  }, [activeWebsite])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const handleCreate = async () => {
    if (!activeWebsite) return
    const body: Record<string, unknown> = { ...form, websiteId: activeWebsite.websiteId }
    if (!body.scheduledAt) delete body.scheduledAt

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setShowCreate(false)
      setForm({ name: '', description: '', type: 'EMAIL', subject: '', content: '', target: 'ALL_VISITORS', scheduledAt: '' })
      fetchCampaigns()
    }
  }

  const updateStatus = async (id: string, status: Campaign['status']) => {
    await fetch('/api/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchCampaigns()
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
    fetchCampaigns()
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kampanyalar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">E-posta ve bildirim kampanyalarını yönetin</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition"
        >
          + Kampanya Oluştur
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Kampanya</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kampanya Adı</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Kampanya adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tür</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as Campaign['type'] })}
                  className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                >
                  <option value="EMAIL">E-posta</option>
                  <option value="IN_APP">Uygulama İçi</option>
                  <option value="BROADCAST">Toplu Mesaj</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Kampanya açıklaması"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konu</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="E-posta konusu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İçerik</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                placeholder="Kampanya içeriği"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planlanan Tarih</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-[#EDE9FE] dark:bg-gray-700 text-[#4A2080] dark:text-gray-300 font-medium rounded-xl transition">İptal</button>
            <button onClick={handleCreate} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition">Oluştur</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#EDE9FE] dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Henüz kampanya yok</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">İlk kampanyanızı oluşturun</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E0F0] dark:border-gray-700">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kampanya</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gönderim</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Açılma</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tıklama</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yanıt</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0F0] dark:divide-gray-700">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F5F3FF] dark:hover:bg-gray-750 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{c.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${TYPE_COLORS[c.type]}`}>{TYPE_MAP[c.type]}</span>
                        {c.scheduledAt && (
                          <span className="text-xs text-gray-400">{new Date(c.scheduledAt).toLocaleDateString('tr-TR')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[c.status]}`}>{STATUS_MAP[c.status]}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{c.sentCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{c.openCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{c.clickCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{c.replyCount}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === 'DRAFT' && (
                          <button onClick={() => updateStatus(c.id, 'ACTIVE')} className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition">Aktifleştir</button>
                        )}
                        {c.status === 'ACTIVE' && (
                          <button onClick={() => updateStatus(c.id, 'PAUSED')} className="px-3 py-1.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition">Duraklat</button>
                        )}
                        {c.status === 'PAUSED' && (
                          <button onClick={() => updateStatus(c.id, 'ACTIVE')} className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition">Devam Ettir</button>
                        )}
                        {(c.status === 'DRAFT' || c.status === 'PAUSED') && (
                          <button onClick={() => deleteCampaign(c.id)} className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition">Sil</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
