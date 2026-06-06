'use client'

import { useState, useEffect } from 'react'
import { useWebsite } from '@/lib/hooks/use-website'

export default function SettingsPage() {
  const { website, isLoading, updateWebsite } = useWebsite()
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (website) {
      setName(website.name || '')
      setDomain(website.domain || '')
    }
  }, [website])

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Website adı boş olamaz' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await updateWebsite({ name: name.trim(), domain: domain.trim() })
      setMessage({ type: 'success', text: 'Ayarlar kaydedildi!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kaydetme başarısız' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ayarlar</h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Genel Ayarlar</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#1972F5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website Adı
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1972F5] focus:border-transparent outline-none transition"
                placeholder="Web sitenizin adı"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1972F5] focus:border-transparent outline-none transition"
                placeholder="orneksite.com"
              />
            </div>

            {message && (
              <div className={`px-4 py-2 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#1972F5] hover:bg-[#1565DB] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-md shadow-[#1972F5]/30"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}