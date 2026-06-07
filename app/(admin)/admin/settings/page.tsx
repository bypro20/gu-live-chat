'use client'

import { useEffect, useState } from 'react'
import { Settings, Mail, Building2, Layers, AlertTriangle, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/lib/toast'

const planLimits = [
  { name: 'Ücretsiz', desc: '2 temsilci / 100 sohbet', accent: 'gray' },
  { name: 'Başlangıç', desc: '5 temsilci / 1.000 sohbet', accent: 'blue' },
  { name: 'Profesyonel', desc: '15 temsilci / Sınırsız', accent: 'blue' },
  { name: 'İş', desc: 'Sınırsız / Sınırsız', accent: 'emerald' },
]

const accentMap: Record<string, string> = {
  gray: 'border-white/[0.06] bg-white/[0.02]',
  blue: 'border-blue-500/20 bg-blue-500/[0.06]',
  emerald: 'border-emerald-500/20 bg-emerald-500/[0.06]',
}

const accentText: Record<string, string> = {
  gray: 'text-gray-300',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [platformName, setPlatformName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Yüklenemedi')
        setPlatformName(d.platformName || '')
        setSupportEmail(d.supportEmail || '')
      })
      .catch((e) => {
        toast({ title: e instanceof Error ? e.message : 'Ayarlar yüklenemedi', variant: 'error' })
      })
      .finally(() => setLoading(false))
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformName, supportEmail }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Kaydedilemedi')
      setPlatformName(d.platformName)
      setSupportEmail(d.supportEmail)
      toast({ title: 'Ayarlar kaydedildi', variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Kayıt başarısız', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleClearConversations = async () => {
    const ok = window.confirm(
      'Tüm sohbetleri ve mesajları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
    )
    if (!ok) return
    const confirmText = window.prompt('Onaylamak için SIL yazın:')
    if (confirmText !== 'SIL') return

    setClearing(true)
    try {
      const res = await fetch('/api/admin/maintenance/clear-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'SIL' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Silinemedi')
      toast({ title: `${d.deletedConversations} sohbet silindi`, variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'İşlem başarısız', variant: 'error' })
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1100px] mx-auto">
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Admin Ayarları</h1>
          <Settings className="w-5 h-5 text-gray-500" />
        </div>
        <p className="text-gray-500 text-sm">Platform genel ayarlarını yönetin</p>
      </div>

      <div className="space-y-5 lg:space-y-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-primary" />
            Genel Ayarlar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Platform Adı</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Destek E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-brand"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
            <Layers className="w-4 h-4 text-primary" />
            Varsayılan Plan Limitleri
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {planLimits.map((plan) => (
              <div key={plan.name} className={`p-4 rounded-xl border ${accentMap[plan.accent]}`}>
                <h3 className={`font-semibold text-sm ${accentText[plan.accent]}`}>{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{plan.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-5 sm:p-6">
          <h2 className="text-base font-semibold text-red-400 flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4" />
            Tehlikeli Alan
          </h2>
          <p className="text-sm text-gray-400 mb-4">Bu işlemler geri alınamaz. Dikkatli ilerleyin.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleClearConversations}
              disabled={clearing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50 transition-all"
            >
              {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Tüm Sohbetleri Sil
            </button>
            <p className="text-xs text-gray-500 self-center">
              Tüm verileri silmek için destek ekibiyle iletişime geçin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
