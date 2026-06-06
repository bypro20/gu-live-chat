'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const COMPONENT_STATUSES = [
  { value: 'OPERATIONAL', label: 'Çalışıyor', color: 'bg-success', textColor: 'text-success', bg: 'bg-success-light' },
  { value: 'DEGRADED_PERFORMANCE', label: 'Yavaşlama', color: 'bg-warning', textColor: 'text-warning', bg: 'bg-warning-light' },
  { value: 'PARTIAL_OUTAGE', label: 'Kısmi Kesinti', color: 'bg-orange-500', textColor: 'text-orange-500', bg: 'bg-orange-50' },
  { value: 'MAJOR_OUTAGE', label: 'Büyük Kesinti', color: 'bg-destructive', textColor: 'text-destructive', bg: 'bg-destructive-light' },
  { value: 'UNDER_MAINTENANCE', label: 'Bakımda', color: 'bg-muted-foreground', textColor: 'text-muted-foreground', bg: 'bg-muted' },
]

const INCIDENT_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  INVESTIGATING: { label: 'İnceleniyor', color: 'text-destructive', bg: 'bg-destructive-light' },
  IDENTIFIED: { label: 'Tespit Edildi', color: 'text-warning', bg: 'bg-warning-light' },
  MONITORING: { label: 'İzleniyor', color: 'text-info', bg: 'bg-info-light' },
  RESOLVED: { label: 'Çözüldü', color: 'text-success', bg: 'bg-success-light' },
}

function getUptimeStatus(components: { status: string }[]) {
  if (components.length === 0) return { label: 'Veri Yok', color: 'bg-muted-foreground' }
  const hasMajor = components.some(c => c.status === 'MAJOR_OUTAGE')
  const hasPartial = components.some(c => c.status === 'PARTIAL_OUTAGE')
  const hasDegraded = components.some(c => c.status === 'DEGRADED_PERFORMANCE')
  const hasMaintenance = components.some(c => c.status === 'UNDER_MAINTENANCE')
  if (hasMajor) return { label: 'Büyük Kesinti', color: 'bg-destructive' }
  if (hasPartial) return { label: 'Kısmi Kesinti', color: 'bg-orange-500' }
  if (hasDegraded) return { label: 'Yavaşlama', color: 'bg-warning' }
  if (hasMaintenance) return { label: 'Bakımda', color: 'bg-muted-foreground' }
  return { label: 'Tüm Sistemler Çalışıyor', color: 'bg-success' }
}

export default function PublicStatusPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [pageData, setPageData] = useState<{
    title: string
    description: string
    logoUrl: string
    primaryColor: string
    twitterHandle: string
    showHistory: boolean
  } | null>(null)
  const [components, setComponents] = useState<{ id: string; name: string; description: string; status: string; order: number; groupName: string }[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/status-page?subdomain=${subdomain}`)
      .then(res => {
        if (!res.ok) throw new Error('Sayfa bulunamadı')
        return res.json()
      })
      .then(data => {
        if (!data.page?.isActive) throw new Error('Sayfa aktif değil')
        setPageData(data.page)
        setComponents(data.components || [])
        setIncidents(data.incidents || [])
        document.documentElement.style.setProperty('--status-primary', data.page.primaryColor || '#1972F5')
      })
      .catch(() => setError('Durum sayfası bulunamadı'))
      .finally(() => setLoading(false))
  }, [subdomain])

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubscribed(true)
    setTimeout(() => setSubscribed(false), 3000)
    setEmail('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-4" />
          <div className="h-6 w-48 bg-gray-200 rounded-lg mx-auto" />
        </div>
      </div>
    )
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Sayfa Bulunamadı</h1>
          <p className="text-gray-500 mt-1">Bu durum sayfası mevcut değil veya aktif değil.</p>
        </div>
      </div>
    )
  }

  const primaryColor = pageData?.primaryColor || '#1972F5'
  const uptime = getUptimeStatus(components)

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FC' }}>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          {pageData.logoUrl && (
            <img src={pageData.logoUrl} alt={pageData.title} className="h-12 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageData.title}</h1>
          {pageData.description && (
            <p className="text-gray-500">{pageData.description}</p>
          )}
        </div>

        {/* Uptime Indicator */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
          <div className={`w-5 h-5 rounded-full mx-auto mb-3 ${uptime.color}`} />
          <h2 className="text-xl font-bold text-gray-900">{uptime.label}</h2>
          {components.length > 0 && (
            <p className="text-gray-400 text-sm mt-1">
              {components.filter(c => c.status === 'OPERATIONAL').length}/{components.length} bileşen çalışıyor
            </p>
          )}
        </div>

        {/* Components */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Sistem Bileşenleri</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {components.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                Henüz bileşen tanımlanmamış.
              </div>
            )}
            {components.sort((a, b) => a.order - b.order).map((comp) => {
              const statusInfo = COMPONENT_STATUSES.find(s => s.value === comp.status)
              return (
                <div key={comp.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{comp.name}</p>
                    {comp.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{comp.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusInfo?.color || 'bg-gray-300'}`} />
                    <span className={`text-sm font-medium ${statusInfo?.textColor || 'text-gray-500'}`}>
                      {statusInfo?.label || comp.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Incidents */}
        {incidents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Geçmiş Olaylar</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {incidents.map((inc) => {
                const statusInfo = INCIDENT_STATUSES[inc.status] || { label: inc.status, color: 'text-gray-500', bg: 'bg-gray-100' }
                return (
                  <div key={inc.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statusInfo.color.replace('text', 'bg')}`} />
                          <h4 className="text-sm font-semibold text-gray-900">{inc.title}</h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{inc.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(inc.startedAt).toLocaleDateString('tr-TR', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {inc.updates?.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-2">
                        {inc.updates.map((u: any) => {
                          const us = INCIDENT_STATUSES[u.status] || { label: u.status, color: 'text-gray-500' }
                          return (
                            <div key={u.id} className="text-xs">
                              <span className={`font-medium ${us.color}`}>{us.label}</span>
                              <span className="text-gray-500"> — {u.message}</span>
                              <p className="text-gray-400 mt-0.5">
                                {new Date(u.createdAt).toLocaleDateString('tr-TR', {
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Subscribe */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Güncellemelerden Haberdar Olun</h3>
          <p className="text-sm text-gray-500 mb-4">
            Yeni bir olay bildirildiğinde veya bir bileşen durumu değiştiğinde size haber verelim.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 outline-none text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-white font-medium rounded-xl text-sm transition hover:opacity-90 shrink-0"
              style={{ background: primaryColor }}
            >
              {subscribed ? 'Abone Olundu ✓' : 'Abone Ol'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          {pageData.twitterHandle && (
            <a
              href={`https://twitter.com/${pageData.twitterHandle.replace('@', '')}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {pageData.twitterHandle}
            </a>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Powered by Gu Live Chat
          </p>
        </div>
      </div>
    </div>
  )
}
