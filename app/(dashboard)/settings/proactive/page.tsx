'use client'

import { useState, useEffect } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

interface ProactiveMessage {
  id: string
  websiteId: string
  title: string
  message: string
  triggerType: string
  triggerValue: string | null
  targetPages: string | null
  isActive: boolean
  delay: number
  showOnce: boolean
  createdAt: string
}

const TRIGGER_LABELS: Record<string, string> = {
  TIME_ON_PAGE: 'Süre/Sayfada Kalma',
  SCROLL_DEPTH: 'Kaydırma Derinliği',
  EXIT_INTENT: 'Çıkış Niyeti',
  PAGE_VISIT: 'Sayfa Ziyareti',
  CUSTOM: 'Özel',
}

const TRIGGER_PLACEHOLDERS: Record<string, string> = {
  TIME_ON_PAGE: 'Saniye (örn: 30)',
  SCROLL_DEPTH: 'Yüzde (örn: 50)',
  EXIT_INTENT: '-',
  PAGE_VISIT: 'URL (örn: /fiyat)',
  CUSTOM: 'Değer',
}

export default function ProactiveSettingsPage() {
  const { activeWebsite } = useActiveWebsite()
  const [messages, setMessages] = useState<ProactiveMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ProactiveMessage | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    message: '',
    triggerType: 'TIME_ON_PAGE',
    triggerValue: '',
    targetPages: '',
    delay: 0,
    showOnce: true,
    isActive: true,
  })

  const [saving, setSaving] = useState(false)

  const fetchMessages = async () => {
    if (!activeWebsite?.websiteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/proactive?websiteId=${activeWebsite.websiteId}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [activeWebsite?.websiteId])

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      triggerType: 'TIME_ON_PAGE',
      triggerValue: '',
      targetPages: '',
      delay: 0,
      showOnce: true,
      isActive: true,
    })
    setEditing(null)
    setShowForm(false)
  }

  const handleEdit = (msg: ProactiveMessage) => {
    setForm({
      title: msg.title,
      message: msg.message,
      triggerType: msg.triggerType,
      triggerValue: msg.triggerValue || '',
      targetPages: msg.targetPages || '',
      delay: msg.delay,
      showOnce: msg.showOnce,
      isActive: msg.isActive,
    })
    setEditing(msg)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!activeWebsite?.websiteId || !form.title.trim() || !form.message.trim()) return
    setSaving(true)
    try {
      const body = {
        ...(editing ? { id: editing.id } : { websiteId: activeWebsite.websiteId }),
        title: form.title.trim(),
        message: form.message.trim(),
        triggerType: form.triggerType,
        triggerValue: form.triggerType === 'EXIT_INTENT' ? null : form.triggerValue || null,
        targetPages: form.targetPages.trim() || null,
        delay: form.delay,
        showOnce: form.showOnce,
        isActive: form.isActive,
      }

      const res = await fetch('/api/proactive', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        resetForm()
        fetchMessages()
      }
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hedefli mesajı silmek istediğinize emin misiniz?')) return
    try {
      await fetch(`/api/proactive?id=${id}`, { method: 'DELETE' })
      fetchMessages()
    } catch {}
  }

  const handleToggleActive = async (msg: ProactiveMessage) => {
    try {
      await fetch('/api/proactive', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msg.id, isActive: !msg.isActive }),
      })
      fetchMessages()
    } catch {}
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hedefli Mesajlar</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ziyaretçilere belirli tetikleyicilere göre otomatik mesaj gösterin</p>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-4 py-2 bg-[#6C3CE1] hover:bg-[#5B2FC5] text-white font-medium rounded-xl transition shadow-md shadow-[#6C3CE1]/30 text-sm"
        >
          {showForm ? 'İptal' : 'Yeni Mesaj Ekle'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Mesajı Düzenle' : 'Yeni Hedefli Mesaj'}
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6C3CE1] focus:border-transparent outline-none transition"
                placeholder="Mesaj başlığı"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mesaj</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6C3CE1] focus:border-transparent outline-none transition resize-none"
                rows={3}
                placeholder="Mesaj içeriği"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tetikleyici Tipi</label>
                <select
                  value={form.triggerType}
                  onChange={(e) => setForm(prev => ({ ...prev, triggerType: e.target.value, triggerValue: '' }))}
                  className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6C3CE1] focus:border-transparent outline-none transition"
                >
                  {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              {form.triggerType !== 'EXIT_INTENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tetikleyici Değeri</label>
                  <input
                    type="text"
                    value={form.triggerValue}
                    onChange={(e) => setForm(prev => ({ ...prev, triggerValue: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6C3CE1] focus:border-transparent outline-none transition"
                    placeholder={TRIGGER_PLACEHOLDERS[form.triggerType]}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hedef Sayfalar (JSON dizi veya *, boş bırakılırsa tüm sayfalar)</label>
              <input
                type="text"
                value={form.targetPages}
                onChange={(e) => setForm(prev => ({ ...prev, targetPages: e.target.value }))}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6C3CE1] focus:border-transparent outline-none transition"
                placeholder='["/fiyat", "/iletisim"] veya *'
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gecikme (saniye)</label>
                <input
                  type="number"
                  value={form.delay}
                  onChange={(e) => setForm(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#F5F3FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6C3CE1] focus:border-transparent outline-none transition"
                  min={0}
                />
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showOnce}
                    onChange={(e) => setForm(prev => ({ ...prev, showOnce: e.target.checked }))}
                    className="w-4 h-4 text-[#6C3CE1] rounded border-gray-300 focus:ring-[#6C3CE1]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Bir kere göster</span>
                </label>
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-[#6C3CE1] rounded border-gray-300 focus:ring-[#6C3CE1]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Aktif</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.message.trim()}
                className="px-6 py-2.5 bg-[#6C3CE1] hover:bg-[#5B2FC5] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-md shadow-[#6C3CE1]/30"
              >
                {saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Oluştur'}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#6C3CE1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-[#EDE9FE] dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">Henüz hedefli mesaj yok</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Yeni bir mesaj oluşturmak için yukarıdaki butonu kullanın</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E0F0] dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{msg.title}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      msg.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {msg.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{msg.message}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>{TRIGGER_LABELS[msg.triggerType] || msg.triggerType}</span>
                    {msg.triggerValue && <span>Değer: {msg.triggerValue}</span>}
                    {msg.delay > 0 && <span>Gecikme: {msg.delay}s</span>}
                    <span>{msg.showOnce ? 'Bir kere' : 'Her seferinde'}</span>
                    {msg.targetPages && <span className="truncate max-w-[200px]">Sayfalar: {msg.targetPages}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(msg)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                      msg.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={msg.isActive ? 'Devre dışı bırak' : 'Aktifleştir'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {msg.isActive ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 01-12.728 0m12.728 0a9 9 0 00-12.728 0m9.9 2.829a5 5 0 000-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(msg)}
                    className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center justify-center transition"
                    title="Düzenle"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition"
                    title="Sil"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
