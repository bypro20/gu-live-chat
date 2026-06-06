'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

const boyutAyarları = {
  sm: { svg: 28, metin: 'text-sm', aralik: 'gap-1.5' },
  default: { svg: 36, metin: 'text-lg', aralik: 'gap-2.5' },
  lg: { svg: 48, metin: 'text-2xl', aralik: 'gap-3' },
  hero: { svg: 88, metin: 'text-4xl', aralik: 'gap-4' },
}

interface LogoÖzellikleri {
  boyut?: keyof typeof boyutAyarları
  metinGoster?: boolean
  animasyonlu?: boolean
  linkOlsun?: boolean
  className?: string
}

/**
 * Gu Live Chat Logo Bileşeni
 *
 * Özel SVG logo: Yuvarlak kare arkası + iki sohbet balonu + şimşek simgesi
 * Mor-mavi gradient ile animasyonlu parlama efekti
 *
 * @param boyut - sm, default, lg, hero (ana sayfa büyük logo)
 * @param metinGoster - "Gu Live Chat" yazısını göster/gizle
 * @param animasyonlu - Parlama ve gradient animasyonlarını aç/kapat
 * @param linkOlsun - Logo'ya tıklayınca ana sayfaya yönlendir
 */
export function Logo({
  boyut = 'default',
  metinGoster = true,
  animasyonlu = true,
  linkOlsun = false,
  className = '',
}: LogoÖzellikleri) {
  const ayar = boyutAyarları[boyut]

  const logoİçeriği = (
    <div className={cn('flex items-center', ayar.aralik, className)}>
      {/* Logo ikonu - dış parlama katmanı */}
      <div className={cn('relative', animasyonlu && 'animate-logo-glow')}>
        {/* Hero boyutunda etrafında parlama halkası */}
        {boyut === 'hero' && (
          <div className={cn(
            'absolute -inset-4 rounded-3xl bg-gradient-brand opacity-20 blur-xl',
            animasyonlu && 'animate-glow-ring'
          )} />
        )}
        {/* Özel SVG Logo */}
        <svg
          width={ayar.svg}
          height={ayar.svg}
          viewBox="0 0 48 48"
          fill="none"
          className={cn(boyut === 'hero' && animasyonlu && 'animate-float')}
          style={boyut === 'hero' ? { animationDuration: '6s' } : undefined}
        >
          <defs>
            <linearGradient id="gu-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7C4DF6" />
              <stop offset="100%" stopColor="#4A7CF7" />
            </linearGradient>
          </defs>
          {/* Yuvarlak kare arka plan */}
          <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#gu-logo-grad)" />
          {/* Arka sohbet balonu (küçük, yarı saydam) */}
          <path
            d="M24 10h7a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-1.5l-2.5 2.5V19H24a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3z"
            fill="white"
            fillOpacity="0.25"
          />
          {/* Ön sohbet balonu (ana) */}
          <path
            d="M13 17h16a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-4l-5 5v-5h-7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Şimşek simgesi - "anında" bağlantıyı simgeler */}
          <path
            d="M22 20l-3 4h2l-1 4 5-5h-2l1-3z"
            fill="#7C4DF6"
          />
        </svg>
      </div>
      {/* Marka yazısı - animasyonlu gradient */}
      {metinGoster && (
        <span className={cn(
          ayar.metin,
          'font-extrabold tracking-tight',
          animasyonlu ? 'animate-text-gradient' : 'text-gradient-brand'
        )}>
          Gu Live Chat
        </span>
      )}
    </div>
  )

  /* Link olarak sar (tıklayınca ana sayfaya gitsin) */
  if (linkOlsun) {
    return (
      <Link href="/" className="shrink-0">
        {logoİçeriği}
      </Link>
    )
  }

  return logoİçeriği
}