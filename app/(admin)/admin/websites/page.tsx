'use client'

import { useEffect, useState } from 'react'
import { Globe, Search, MessageSquare, Users, Calendar } from 'lucide-react'
import { useToast } from '@/lib/toast'

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

const planBadge: Record<string, string> = {
  FREE: 'bg-white/[0.06] text-gray-400 border-white/[0.06]',
  STARTER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PRO: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  BUSINESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export default function AdminWebsitesPage() {
  const { toast } = useToast()
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
        } else {
          const data = await res.json().catch(() => ({}))
          toast({ title: data.error || 'Siteler yüklenemedi', variant: 'error' })
        }
      } catch (err) {
        toast({ title: 'Siteler yüklenemedi', variant: 'error' })
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
        toast({ title: 'Plan güncellendi', variant: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || 'Plan güncellenemedi', variant: 'error' })
      }
    } catch (err) {
      toast({ title: 'Plan güncellenemedi', variant: 'error' })
      console.error('Failed to update plan:', err)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Site Yönetimi</h1>
          <Globe className="w-5 h-5 text-gray-500" />
        </div>
        <p className="text-gray-500 text-sm">Tüm siteleri görüntüleyin ve planlarını yönetin · {websites.length} site</p>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Site adı veya domain ara..."
            className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Websites Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500 text-sm">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Yükleniyor...
          </div>
        ) : filteredWebsites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Globe className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Site bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Site', 'Sahip', 'Plan', 'Sohbet', 'Üye', 'Kayıt'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredWebsites.map(website => (
                  <tr key={website.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0 border border-white/10">
                          {website.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{website.name}</p>
                          <p className="text-xs text-gray-500 truncate">{website.domain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white truncate">{website.owner?.name || 'İsimsiz'}</p>
                      <p className="text-xs text-gray-500 truncate">{website.owner?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={website.plan}
                        onChange={e => changePlan(website.id, e.target.value)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border outline-none cursor-pointer transition-colors ${planBadge[website.plan] || planBadge.FREE}`}
                      >
                        <option value="FREE" className="bg-[#14142A] text-white">Ücretsiz</option>
                        <option value="STARTER" className="bg-[#14142A] text-white">Başlangıç</option>
                        <option value="PRO" className="bg-[#14142A] text-white">Profesyonel</option>
                        <option value="BUSINESS" className="bg-[#14142A] text-white">İş</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                        {website._count?.conversations || 0}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Users className="w-3.5 h-3.5 text-gray-500" />
                        {website._count?.members || 0}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(website.createdAt).toLocaleDateString('tr-TR')}
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
