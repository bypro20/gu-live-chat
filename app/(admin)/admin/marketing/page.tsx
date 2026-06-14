'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, ExternalLink, Megaphone } from 'lucide-react'
import { MARKETING_CAMPAIGN_LINKS, MARKETING_SETUP_STEPS } from '@/lib/marketing-campaigns'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

function EnvStatus({ name }: { name: string }) {
  const value = process.env[name]
  const ok = Boolean(value && value.length > 0)
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
      {ok ? 'Aktif' : 'Eksik'}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Kopyalandı' : 'Kopyala'}
    </button>
  )
}

function CampaignLinkRow({ link }: { link: (typeof MARKETING_CAMPAIGN_LINKS)[number] }) {
  return (
    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{link.channel}</span>
        <span className="text-sm font-medium text-white">{link.label}</span>
      </div>
      <p className="text-xs text-slate-500">{link.tip}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 text-xs text-slate-300 bg-slate-900 p-2 rounded-lg overflow-x-auto">{link.url}</code>
        <CopyButton text={link.url} />
      </div>
    </div>
  )
}

export default function AdminMarketingPage() {
  return (
    <div className="admin-page max-w-5xl space-y-8 pb-12">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm admin-text-muted hover:admin-text mb-4">
          <ArrowLeft className="w-4 h-4" /> Admin paneli
        </Link>
        <AdminPageHeader
          title="Pazarlama & Reklam Merkezi"
          description="Pixel kurulumu, hazır kampanya linkleri ve sosyal medya reklam rehberi"
        />
      </div>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">1. Takip kodları (Vercel env)</h2>
        <p className="text-sm text-slate-400">
          Vercel → Settings → Environment Variables. Deploy sonrası otomatik aktif olur.
        </p>
        <div className="space-y-3">
          {MARKETING_SETUP_STEPS.map((step) => {
            const envKey = step.env.split(' ')[0] ?? step.env
            return (
              <div key={step.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div>
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <code className="text-xs text-violet-300">{step.env}</code>
                </div>
                <div className="flex items-center gap-2">
                  <EnvStatus name={envKey} />
                  <a href={step.doc} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
                    Kurulum <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">2. Hazır kampanya linkleri</h2>
        <p className="text-sm text-slate-400">
          Reklam panellerine yapıştırın. UTM kaynak raporu admin Genel Bakış&apos;ta görünür.
        </p>
        <div className="space-y-3">
          {MARKETING_CAMPAIGN_LINKS.map((link) => (
            <CampaignLinkRow key={link.id} link={link} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-700/50 bg-emerald-950/30 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-emerald-300">⭐ Öncelik: Google Arama Ads</h2>
        <p className="text-sm text-slate-300">
          En hızlı dönüşüm + en düşük kayıt maliyeti. Soğuk Instagram trafiğinden 2–3x daha verimli.
        </p>
        <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/50">
          <p className="text-xs text-slate-500 mb-1">Landing URL (Google Ads&apos;e yapıştır)</p>
          <code className="text-sm text-emerald-300 break-all">https://gulivechat.com/basla?utm_source=google&utm_medium=cpc&utm_campaign=search-canli-destek</code>
        </div>
        <p className="text-xs text-slate-500">Günlük bütçe: ₺80 · Sadece Arama ağı · Negatif kelimeler ekleyin</p>
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Önerilen aylık bütçe (başlangıç)</h2>
        <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
          <li><strong className="text-emerald-400">Google Ads (önce):</strong> ₺2.400/ay (₺80/gün) — arama reklamları</li>
          <li><strong className="text-white">Meta retargeting (2. hafta):</strong> ₺1.500/ay — site ziyaretçileri</li>
          <li><strong className="text-slate-400">LinkedIn (sonra):</strong> bütçe artınca</li>
        </ul>
      </section>
    </div>
  )
}
