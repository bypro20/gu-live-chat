'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/marketing/logo'
import { Zap, Shield, Bot, Globe } from 'lucide-react'
import { useNativeApp } from '@/lib/hooks/use-native-app'
import { nativeAppHomePath } from '@/lib/native-app'

const markaÖzellikleri = [
  { simge: Zap, metin: '30 saniyede kurulum' },
  { simge: Shield, metin: 'KVKK uyumlu güvenli altyapı' },
  { simge: Bot, metin: 'AI destekli akıllı chatbot' },
  { simge: Globe, metin: 'Çoklu kanal desteği' },
]

const oauthHataMesajlari: Record<string, string> = {
  OAuthSignin: 'Google girişi başlatılamadı. Lütfen tekrar deneyin.',
  OAuthCallback: 'Google giriş işlemi tamamlanamadı. Lütfen tekrar deneyin.',
  OAuthCreateAccount: 'Hesap oluşturulamadı. Lütfen e-posta ile kayıt olun.',
  OAuthAccountNotLinked: 'Bu e-posta zaten kayıtlı. E-posta/şifre ile giriş yapın.',
  AccessDenied: 'Erişim reddedildi. Hesabınız askıya alınmış olabilir.',
  Configuration: 'Sunucu yapılandırma hatası. Lütfen birkaç saniye bekleyip tekrar deneyin.',
  Verification: 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.',
  Default: 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.',
}

export default function GirisFormu({ googleAktif }: { googleAktif: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isNativeApp } = useNativeApp()
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [googleYukleniyor, setGoogleYukleniyor] = useState(false)
  const [oauthHataKodu, setOauthHataKodu] = useState<string | null>(null)

  useEffect(() => {
    const oauthHata = searchParams.get('error')
    if (oauthHata) {
      setOauthHataKodu(oauthHata)
      setHata(oauthHataMesajlari[oauthHata] || oauthHataMesajlari.Default)
    }
  }, [searchParams])

  const googleIleGiris = async () => {
    setGoogleYukleniyor(true)
    setHata('')
    try {
      await signIn('google', { callbackUrl: searchParams.get('callbackUrl') || '/dashboard' })
    } catch {
      setHata('Google girişi başlatılamadı. Lütfen tekrar deneyin.')
      setGoogleYukleniyor(false)
    }
  }

  const formuGonder = async (e: React.FormEvent) => {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')

    try {
      const sonuc = await signIn('credentials', { email: eposta, password: sifre, redirect: false })
      if (sonuc?.error) {
        setHata('E-posta veya şifre hatalı')
      } else {
        const oturumSonucu = await fetch('/api/auth/session')
        const oturum = await oturumSonucu.json()
        if (oturum?.user?.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push(isNativeApp ? nativeAppHomePath() : (searchParams.get('callbackUrl') || '/dashboard'))
        }
        router.refresh()
      }
    } catch {
      setHata('Giriş sırasında bir hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className={`min-h-screen min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden flex ${isNativeApp ? 'native-app-auth bg-[#0B1220]' : 'mobile-safe-area'}`}>
      {/* Sol Panel — Crisp tarzı beyaz/mavi */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-primary-light border-r border-border items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <div className="flex justify-center mb-6">
            <Logo boyut="lg" metinGoster={false} />
          </div>
          <h2 className="text-3xl font-bold text-foreground text-center">Gu Chat</h2>
          <p className="text-muted-foreground mt-3 text-lg text-center leading-relaxed">
            Profesyonel canlı destek sistemi ile müşterilerinize anında yanıt verin.
          </p>
          <div className="mt-12 space-y-5">
            {markaÖzellikleri.map(özellik => (
              <div key={özellik.metin} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-xs group-hover:border-primary/30 transition-colors">
                  <özellik.simge className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">{özellik.metin}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">Türk yapımı · KVKK uyumlu · 99.9% uptime</p>
          </div>
        </div>
      </div>

      {/* Sağ Panel - Beyaz Form Bölümü (tamamen dolar) */}
      <div className={`flex-1 flex items-center justify-center p-6 sm:p-8 min-h-screen lg:min-h-0 ${isNativeApp ? 'bg-[#0B1220]' : 'bg-white dark:bg-gray-950'}`}>
        <div className="w-full max-w-md">
          <div className={`${isNativeApp ? 'flex' : 'lg:hidden flex'} justify-center mb-8`}>
            <Logo boyut={isNativeApp ? 'lg' : 'default'} animasyonlu={isNativeApp} />
          </div>

          <div className="mb-8">
            <h1 className={`text-2xl lg:text-3xl font-bold ${isNativeApp ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {isNativeApp ? 'Gu Chat' : 'Hoş Geldiniz'}
            </h1>
            <p className={`mt-2 ${isNativeApp ? 'text-slate-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {isNativeApp ? 'Hesabınıza giriş yapın' : 'Hesabınıza giriş yapın'}
            </p>
          </div>

          {/* Hata mesajı */}
          {hata && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-3 mb-6 text-sm">
              {hata}
            </div>
          )}

          {/* Google ile giriş */}
          {googleAktif && (
            <div className="space-y-3 mb-6">
              <button
                onClick={googleIleGiris}
                disabled={googleYukleniyor}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-muted transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleYukleniyor ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Yönlendiriliyor...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {oauthHataKodu ? 'Tekrar Dene — Google ile Giriş' : 'Google ile devam et'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Ayırıcı çizgi */}
          {googleAktif && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-950 text-gray-500">veya e-posta ile</span>
              </div>
            </div>
          )}

          {/* Giriş formu */}
          <form onSubmit={formuGonder} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted/40 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Giriş butonu - gradient ve gölge efekti */}
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-brand-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {yukleniyor ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Kayıt linki */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Kayıt Ol
              </Link>
            </p>
          </div>

          {!isNativeApp && (
          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Siteye Dön
            </Link>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
