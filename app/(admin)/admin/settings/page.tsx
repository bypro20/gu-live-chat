'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Settings, Mail, Building2, Layers, AlertTriangle, Trash2, Loader2, CheckCircle2,
  Shield, Lock, Eye, EyeOff, KeyRound,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useToast } from '@/lib/toast'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

function passwordStrength(password: string) {
  const checks = [
    { label: 'En az 10 karakter', ok: password.length >= 10 },
    { label: 'Küçük harf (a-z)', ok: /[a-z]/.test(password) },
    { label: 'Büyük harf (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'Rakam (0-9)', ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  return { checks, score, label: score <= 1 ? 'Zayıf' : score <= 3 ? 'Orta' : 'Güçlü' }
}

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
  const [adminEmail, setAdminEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword])
  const emailChanged = newEmail.trim().toLowerCase() !== adminEmail.toLowerCase() && newEmail.includes('@')

  useEffect(() => {
    fetch('/api/admin/me')
      .then(async (r) => {
        const d = await r.json()
        if (r.ok && d.email) {
          setAdminEmail(d.email)
          setNewEmail(d.email)
        }
      })
      .catch(() => {})

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

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !emailPassword) {
      toast({ title: 'Yeni e-posta ve mevcut şifre gerekli', variant: 'error' })
      return
    }

    setChangingEmail(true)
    try {
      const res = await fetch('/api/admin/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail: newEmail.trim().toLowerCase(),
          currentPassword: emailPassword,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'E-posta güncellenemedi')

      toast({
        title: 'E-posta güncellendi',
        description: 'Yeni adresinizle tekrar giriş yapın.',
        variant: 'success',
      })

      await signOut({ redirect: false })
      window.location.href = '/admin-login'
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'E-posta güncellenemedi', variant: 'error' })
    } finally {
      setChangingEmail(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Tüm şifre alanlarını doldurun', variant: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Yeni şifreler eşleşmiyor', variant: 'error' })
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/admin/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Şifre güncellenemedi')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({
        title: 'Şifre güncellendi',
        description: 'Bir sonraki girişinizde yeni şifrenizi kullanın.',
        variant: 'success',
      })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Şifre güncellenemedi', variant: 'error' })
    } finally {
      setChangingPassword(false)
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
    <div className="admin-page max-w-[1100px]">
      <AdminPageHeader
        title="Admin Ayarları"
        description="Platform genel ayarlarını yönetin"
      />

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

        <div id="guvenlik" className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-8">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Hesap Güvenliği
            </h2>
            <p className="text-xs text-gray-500 mt-1.5">
              Yönetici giriş e-postanızı ve şifrenizi güncelleyin.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Giriş E-postası
                </h3>
                <p className="text-xs text-gray-500 mt-1">Admin paneline girişte kullanılan adres</p>
              </div>
              {adminEmail && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-gray-400">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <span className="text-gray-300">Aktif: {adminEmail}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Yeni e-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                    placeholder="yeni@eposta.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Mevcut şifre (doğrulama)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                    placeholder="Onay için şifreniz"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={showEmailPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={changingEmail || !emailChanged || !emailPassword}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
              >
                {changingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                E-postayı Güncelle
              </button>
              <p className="text-[11px] text-gray-600">
                Değişiklikten sonra oturum kapanır; yeni e-posta ile tekrar giriş yaparsınız.
              </p>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-primary" />
              Şifre Değiştir
            </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Mevcut şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={showCurrent ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Yeni şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                    placeholder="Güçlü bir şifre seçin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={showNew ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Yeni şifre (tekrar)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                    placeholder="Yeni şifreyi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={showConfirm ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword || strength.score < 4}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Şifreyi Güncelle
              </button>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-medium text-gray-400 mb-3">Şifre gücü</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      strength.score <= 1 ? 'bg-red-500 w-1/4' :
                      strength.score <= 3 ? 'bg-amber-500 w-2/3' :
                      'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
                <span className={`text-xs font-semibold ${
                  strength.score <= 1 ? 'text-red-400' :
                  strength.score <= 3 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {strength.label}
                </span>
              </div>
              <ul className="space-y-2">
                {strength.checks.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                    <span className={c.ok ? 'text-gray-300' : 'text-gray-500'}>{c.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-gray-600 mt-4 leading-relaxed">
                Şifre değişikliği anında geçerli olur. Vercel seed ortam değişkenleri ile otomatik senkronize değildir.
              </p>
            </div>
          </div>
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
