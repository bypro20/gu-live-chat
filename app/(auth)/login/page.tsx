'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/marketing/logo'
import { Zap, Shield, Bot, Globe } from 'lucide-react'

const markaÖzellikleri = [
  { simge: Zap, metin: '30 saniyede kurulum' },
  { simge: Shield, metin: 'KVKK uyumlu güvenli altyapı' },
  { simge: Bot, metin: 'AI destekli akıllı chatbot' },
  { simge: Globe, metin: 'Çoklu kanal desteği' },
]

export default function GirisSayfasi() {
  const router = useRouter()
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [googleGoster, setGoogleGoster] = useState(false)

  useEffect(() => {
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => setGoogleGoster(!!data?.google))
      .catch(() => {})
  }, [])

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
          router.push('/dashboard')
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
    <div className="min-h-screen flex">
      {/* Sol Panel - Marka ve Tanıtım (mobilde gizli) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-brand-animated items-center justify-center p-12 overflow-hidden">
        {/* Dekoratif ışık küreleri */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-white/8 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 max-w-md">
          {/* Büyük logo */}
          <div className="flex justify-center mb-6">
            <Logo boyut="lg" metinGoster={false} animasyonlu />
          </div>
          {/* Marka başlığı - animasyonlu beyaz shimmer */}
          <h2 className="text-3xl font-bold text-white text-center animate-text-shimmer-white">Gu Live Chat</h2>
          <p className="text-white/70 mt-3 text-lg text-center leading-relaxed">
            Profesyonel canlı destek sistemi ile müşterilerinize anında yanıt verin.
          </p>

          {/* Özellik listesi */}
          <div className="mt-12 space-y-5">
            {markaÖzellikleri.map(özellik => (
              <div key={özellik.metin} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors duration-300">
                  <özellik.simge className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90 font-medium group-hover:text-white transition-colors duration-300">{özellik.metin}</span>
              </div>
            ))}
          </div>

          {/* Alt bilgi */}
          <div className="mt-12 pt-8 border-t border-white/15 text-center">
            <p className="text-white/50 text-sm">Türk yapımı · KVKK uyumlu · 99.9% uptime</p>
          </div>
        </div>
      </div>

      {/* Sağ Panel - Beyaz Form Bölümü (tamamen dolar) */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950 p-8 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobilde logo göster */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo boyut="default" animasyonlu />
          </div>

          {/* Başlık */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Hoş Geldiniz</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Hesabınıza giriş yapın</p>
          </div>

          {/* Hata mesajı */}
          {hata && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-3 mb-6 text-sm">
              {hata}
            </div>
          )}

          {/* Google ile giriş */}
          {googleGoster && (
            <div className="space-y-3 mb-6">
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-[#F5F3FF] dark:hover:bg-gray-700 transition font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile devam et
              </button>
            </div>
          )}

          {/* Ayırıcı çizgi */}
          {googleGoster && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E0F0] dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-950 text-gray-500">veya e-posta ile</span>
              </div>
            </div>
          )}

          {/* Giriş formu */}
          <form onSubmit={formuGonder} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#4A2080] dark:text-gray-300 mb-1.5">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#FAFAFF] dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#4A2080] dark:text-gray-300 mb-1.5">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E0F0] dark:border-gray-600 rounded-xl bg-[#FAFAFF] dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Giriş butonu - gradient ve gölge efekti */}
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3 px-4 bg-gradient-brand text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-brand-lg hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

          {/* Siteye dönüş */}
          <div className="mt-6 pt-6 border-t border-[#E5E0F0] dark:border-gray-700 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Siteye Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}