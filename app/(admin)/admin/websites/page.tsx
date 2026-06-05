'use client'

import { useEffect, useState } from 'react'

interface Website {
  id: string
  name: string
  domain: string
  websiteId: string
  plan: string
  owner: { id: string; email: string; name: string | null }
  _count: { conversations: number; members: number }
  createdAt: string
}

export default function AdminWebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadWebsites() {
      try {
        const res = await fetch('/api/admin/websites')
        if (res.ok) {
          const data = await res.json()
          setWebsites(data)
        }
      } catch (err) {
        console.error('Failed to load websites:', err)
      } finally {
        setLoading(false)
      }
    }
    loadWebsites()
  }, [])

  const filteredWebsites = websites.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.domain.toLowerCase().includes(search.toLowerCase())
  )

  async function changePlan(websiteId: string, newPlan: string) {
    try {
      const res = await fetch(`/api/admin/websites/${websiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })
      if (res.ok) {
        setWebsites(prev => prev.map(w => w.id === websiteId ? { ...w, plan: newPlan } : w))
      }
    } catch (err) {
      console.error('Failed to update plan:', err)
    }
  }

  const planLabels: Record<string, string> = {
    FREE: 'Ücretsiz',
    STARTER: 'Başlangıç',
    PRO: 'Profesyonel',
    BUSINESS: 'İş',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Site Yönetimi</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Tüm siteleri görüntüleyin ve planlarını yönetin</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Site adı veya domain ara..."
          className="w-full max-w-md px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </div>

      {/* Websites Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
        ) : filteredWebsites.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Site bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Site</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sahip</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sohbet</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Üye</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredWebsites.map(website => (
                  <tr key={website.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{website.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{website.domain}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{website.owner?.name || 'İsimsiz'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{website.owner?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={website.plan}
                        onChange={e => changePlan(website.id, e.target.value)}
                        className="px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="FREE">Ücretsiz</option>
                        <option value="STARTER">Başlangıç</option>
                        <option value="PRO">Profesyonel</option>
                        <option value="BUSINESS">İş</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {website._count?.conversations || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {website._count?.members || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(website.createdAt).toLocaleDateString('tr-TR')}
                      </span>
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