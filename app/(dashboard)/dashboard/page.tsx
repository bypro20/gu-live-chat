'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

export default function DashboardPage() {
  const { stats, isLoading } = useDashboardStats()
  const { activeWebsite } = useActiveWebsite()
  const [copiedCode, setCopiedCode] = useState(false)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F0F1A] dark:text-white">Genel Bakış</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {activeWebsite ? `${activeWebsite.name} — ` : ''}Canlı destek performansınızı takip edin
          </p>
        </div>
        <Link
          href="/inbox"
          className="px-5 py-2.5 bg-gradient-to-r from-[#6C3CE1] to-[#8B5CF6] hover:from-[#5B2CC4] hover:to-[#7C3AED] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#6C3CE1]/30 hover:shadow-[#6C3CE1]/50 hover:scale-[1.02] flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Gelen Kutusunu Aç
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-[#E5E0F0] dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-[#6C3CE1]/8 hover:border-[#6C3CE1]/20 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-md shadow-[#6C3CE1]/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Açık Sohbetler</span>
          </div>
          <p className="text-3xl font-bold text-[#0F0F1A] dark:text-white">
            {isLoading ? <span className="animate-pulse">-</span> : stats.openConversations}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-[#E5E0F0] dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-emerald-500/8 hover:border-emerald-200 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Bugünkü Sohbetler</span>
          </div>
          <p className="text-3xl font-bold text-[#0F0F1A] dark:text-white">
            {isLoading ? <span className="animate-pulse">-</span> : stats.todayConversations}
          </p>
        </div>

        <Link href="/visitors" className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-[#E5E0F0] dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-[#6C3CE1]/8 hover:border-[#6C3CE1]/20 transition-all group cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#3B82F6] to-[#6366F1] rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktif Ziyaretçiler</span>
            {stats.activeVisitors > 0 && (
              <span className="ml-auto flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-[#0F0F1A] dark:text-white">
            {isLoading ? <span className="animate-pulse">-</span> : stats.activeVisitors}
          </p>
          <p className="text-xs text-gray-400 mt-1 group-hover:text-[#6C3CE1] transition-colors">Canlı izleme →</p>
        </Link>

        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-[#E5E0F0] dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-rose-500/8 hover:border-rose-200 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-rose-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Ort. Yanıt Süresi</span>
          </div>
          <p className="text-3xl font-bold text-[#0F0F1A] dark:text-white">
            {isLoading ? <span className="animate-pulse">-</span> : stats.avgResponseTime}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions + Widget */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#E5E0F0] p-6">
            <h2 className="text-base font-bold text-[#0F0F1A] mb-4">Hızlı Başlangıç</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/settings/widget" className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E0F0] hover:border-[#6C3CE1]/30 hover:bg-[#6C3CE1]/5 transition-all group">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] rounded-lg flex items-center justify-center shadow-md shadow-[#6C3CE1]/25 group-hover:shadow-[#6C3CE1]/40 transition-shadow">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0F0F1A]">Widget</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Görünümü özelleştir</p>
                </div>
              </Link>

              <Link href="/settings/team" className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E0F0] hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0F0F1A]">Takım</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Üye davet edin</p>
                </div>
              </Link>

              <Link href="/settings/chatbot" className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E0F0] hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 transition-all group">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#6366F1] rounded-lg flex items-center justify-center shadow-md shadow-[#3B82F6]/25 group-hover:shadow-[#3B82F6]/40 transition-shadow">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0F0F1A]">Chatbot</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Otomatik yanıtlar</p>
                </div>
              </Link>
            </div>

            {/* Widget Installation */}
            <div className="mt-6 pt-6 border-t border-[#E5E0F0]">
              <h2 className="text-base font-bold text-[#0F0F1A] mb-3">Widget Kurulumu</h2>
              <p className="text-sm text-gray-500 mb-4">
                Aşağıdaki kodu sitenizin <code className="text-xs bg-[#6C3CE1]/10 text-[#6C3CE1] px-1.5 py-0.5 rounded font-mono">&lt;head&gt;</code> etiketinden önce ekleyin:
              </p>
              <div className="relative">
                <button
                  onClick={() => {
                    const code = `<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  $gu('set', 'WEBSITE_ID', '${activeWebsite?.websiteId || 'YOUR_WEBSITE_ID'}');
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
                <div className="bg-[#1A1D2E] rounded-xl p-4 overflow-x-auto shadow-lg">
                  <pre className="text-[13px] text-emerald-400 font-mono leading-relaxed">{`<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  $gu('set', 'WEBSITE_ID', '${activeWebsite?.websiteId || 'YOUR_WEBSITE_ID'}');
</script>
<script async src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"></script>`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity + Plan */}
        <div>
          <div className="bg-white rounded-2xl border border-[#E5E0F0] p-6">
            <h2 className="text-base font-bold text-[#0F0F1A] mb-4">Son Aktiviteler</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-[#6C3CE1]/20">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Hoş geldiniz! Canlı destek sisteminiz hazır.</p>
                  <p className="text-xs text-gray-400 mt-0.5">Şimdi</p>
                </div>
              </div>
            </div>

            {/* Plan Info */}
            <div className="mt-6 pt-4 border-t border-[#E5E0F0]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Mevcut Plan</p>
                  <p className="text-sm font-bold text-[#0F0F1A] mt-1">Ücretsiz</p>
                </div>
                <Link href="/settings/billing" className="text-xs font-semibold text-[#6C3CE1] hover:text-[#5B2CC4] transition-colors">
                  Yükselt →
                </Link>
              </div>
              <div className="mt-3 bg-[#6C3CE1]/5 rounded-xl p-3 border border-[#6C3CE1]/10">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Sohbet kullanımı</span>
                  <span>0 / 100</span>
                </div>
                <div className="w-full bg-[#E5E0F0] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#6C3CE1] to-[#8B5CF6] h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}