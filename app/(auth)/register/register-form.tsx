'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/marketing/logo'
import { Zap, Shield, BarChart3, Users } from 'lucide-react'

const markaOzellikleri = [
  { simge: Zap, metin: 'Ücretsiz başlayın, kredi kartı gerekmez' },
  { simge: Shield, metin: 'KVKK uyumlu, Avrupa veri merkezi' },
  { simge: BarChart3, metin: 'Gelişmiş analitik ve raporlama' },
  { simge: Users, metin: 'Sınırsız ekip üyesi ekleme' },
]

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Başlangıç',
  PRO: 'Profesyonel',
  BUSINESS: 'Kurumsal',
}

export default function KayitFormu({ googleAktif }: { googleAktif: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get('plan')
  const inviteToken = searchParams.get('invite')
  const selectedPlanLabel = selectedPlan ? PLAN_LABELS[selectedPlan] : null
  const [inviteInfo, setInviteInfo] = useState<{ websiteName: string; email: string } | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    websiteName: '',
    websiteDomain: '',
  })
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  useEffect(() => {
    if (!inviteToken) return
    fetch(`/api/team/invite?token=${encodeURIComponent(inviteToken)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email) {
          setInviteInfo({ websiteName: data.websiteName, email: data.email })
          setForm((prev) => ({ ...prev, email: data.email }))
        }
      })
      .catch(() => {})
  }, [inviteToken])

  const formuGonder = async (e: React.FormEvent) => {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')

    if (form.password !== form.confirmPassword) {
      setHata('Şifreler eşleşmiyor')
      setYukleniyor(false)
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(inviteToken ? { inviteToken } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setHata(data.error || 'Kayıt sırasında bir hata oluştu')
        setYukleniyor(false)
        return
      }

      const sonuc = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (sonuc?.ok) {
        const afterRegister = data.invited
          ? '/dashboard'
          : selectedPlan && ['STARTER', 'PRO', 'BUSINESS'].includes(selectedPlan)
            ? `/settings/billing?plan=${selectedPlan}`
            : '/dashboard'
        router.push(afterRegister)
        router.refresh()
      } else {
        router.push('/login')
      }
    } catch {
      setHata('Kayıt sırasında bir hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  const guncelle = (alan: string, deger: string) => {
    setForm((onceki) => ({ ...onceki, [alan]: deger }))
  }

  return (
    <div className="min-h-screen flex">
      {/* Sol Panel - Marka ve Tanıtım (mobilde gizli) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-primary-light border-r border-border items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <div className="flex justify-center mb-6">
            <Logo boyut="lg" metinGoster={false} />
          </div>
          <h2 className="text-3xl font-bold text-foreground text-center">Gu Chat</h2>
          <p className="text-muted-foreground mt-3 text-lg text-center leading-relaxed">
            2 dakikada profesyonel canlı destek sistemi kurun.
          </p>
          <div className="mt-12 space-y-5">
            {markaOzellikleri.map(ozellik => (
              <div key={ozellik.metin} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-xs group-hover:border-primary/30 transition-colors">
                  <ozellik.simge className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">{ozellik.metin}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">Türk yapımı · KVKK uyumlu · 99.9% uptime</p>
          </div>
        </div>
      </div>

      {/* Sağ Panel - Beyaz Form Bölümü (tamamen dolar, kaydırılabilir) */}
      <div className="flex-1 flex items-start justify-center bg-white dark:bg-gray-950 p-6 sm:p-8 overflow-y-auto min-h-screen lg:min-h-0 lg:items-center">
        <div className="w-full max-w-md my-8">
          {/* Mobilde logo göster */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo boyut="default" animasyonlu />
          </div>

          {/* Başlık */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {inviteInfo ? 'Takım Davetini Kabul Et' : 'Hesap Oluştur'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {inviteInfo
                ? `${inviteInfo.websiteName} takımına katılmak için hesap oluşturun`
                : selectedPlanLabel
                  ? `${selectedPlanLabel} planı için kayıt olun — 14 gün ücretsiz deneyin`
                  : '2 dakikada ücretsiz başlayın'}
            </p>
            {selectedPlanLabel && (
              <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Seçilen plan: {selectedPlanLabel}
              </span>
            )}
          </div>

          {/* Hata mesajı */}
          {hata && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-3 mb-6 text-sm">
              {hata}
            </div>
          )}

          {/* Google ile kayıt */}
          {googleAktif && (
            <div className="mb-6 space-y-3">
              <button
                onClick={() => signIn('google', {
                  callbackUrl: selectedPlan && ['STARTER', 'PRO', 'BUSINESS'].includes(selectedPlan)
                    ? `/settings/billing?plan=${selectedPlan}`
                    : '/dashboard',
                })}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-muted dark:hover:bg-gray-700 transition font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile kayıt ol
              </button>
            </div>
          )}

          {/* Ayırıcı çizgi */}
          {googleAktif && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-950 text-gray-500">veya e-posta ile</span>
              </div>
            </div>
          )}

          {/* Kayıt formu */}
          <form onSubmit={formuGonder} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1.5">
                Adınız
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => guncelle('name', e.target.value)}
                className="w-full px-4 py-3 border border-border dark:border-gray-600 rounded-xl bg-muted/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Ad Soyad"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1.5">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => guncelle('email', e.target.value)}
                className="w-full px-4 py-3 border border-border dark:border-gray-600 rounded-xl bg-muted/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1.5">
                  Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => guncelle('password', e.target.value)}
                  className="w-full px-4 py-3 border border-border dark:border-gray-600 rounded-xl bg-muted/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1.5">
                  Şifre Tekrar
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => guncelle('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 border border-border dark:border-gray-600 rounded-xl bg-muted/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {!inviteToken && (
              <div className="border-t border-border dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-sm font-medium text-foreground dark:text-gray-300 mb-3">Website Bilgileri</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="websiteName" className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1.5">
                      Website Adı
                    </label>
                    <input
                      id="websiteName"
                      type="text"
                      value={form.websiteName}
                      onChange={(e) => guncelle('websiteName', e.target.value)}
                      className="w-full px-4 py-3 border border-border dark:border-gray-600 rounded-xl bg-muted/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Şirket Adı"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="websiteDomain" className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1.5">
                      Website Domain
                    </label>
                    <input
                      id="websiteDomain"
                      type="text"
                      value={form.websiteDomain}
                      onChange={(e) => guncelle('websiteDomain', e.target.value)}
                      className="w-full px-4 py-3 border border-border dark:border-gray-600 rounded-xl bg-muted/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="orneksite.com"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Kayıt butonu */}
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed  mt-2"
            >
              {yukleniyor ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Hesap oluşturuluyor...
                </span>
              ) : (
                'Hesap Oluştur'
              )}
            </button>
          </form>

          {/* Giriş linki */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
