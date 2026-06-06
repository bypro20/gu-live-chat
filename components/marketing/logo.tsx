'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

const boyutAyarları = {
  sm: { svg: 28, metin: 'text-sm', aralik: 'gap-1.5' },
  default: { svg: 32, metin: 'text-base', aralik: 'gap-2' },
  lg: { svg: 40, metin: 'text-xl', aralik: 'gap-2.5' },
  hero: { svg: 56, metin: 'text-3xl', aralik: 'gap-3' },
}

interface LogoÖzellikleri {
  boyut?: keyof typeof boyutAyarları
  metinGoster?: boolean
  animasyonlu?: boolean
  linkOlsun?: boolean
  className?: string
}

export function Logo({
  boyut = 'default',
  metinGoster = true,
  animasyonlu = false,
  linkOlsun = false,
  className = '',
}: LogoÖzellikleri) {
  const ayar = boyutAyarları[boyut]

  const logoİçeriği = (
    <div className={cn('flex items-center', ayar.aralik, className)}>
      <svg
        width={ayar.svg}
        height={ayar.svg}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="gu-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="11" fill="url(#gu-logo-grad)" />
        <path
          d="M24 10h7a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-1.5l-2.5 2.5V19H24a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3z"
          fill="white"
          fillOpacity="0.25"
        />
        <path
          d="M13 17h16a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-4l-5 5v-5h-7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z"
          fill="white"
          fillOpacity="0.95"
        />
        <path d="M22 20l-3 4h2l-1 4 5-5h-2l1-3z" fill="#2563EB" />
      </svg>
      {metinGoster && (
        <span className={cn(ayar.metin, 'font-bold tracking-tight text-foreground')}>
          Gu <span className="text-primary">Chat</span>
        </span>
      )}
    </div>
  )

  if (linkOlsun) {
    return <Link href="/" className="shrink-0">{logoİçeriği}</Link>
  }
  return logoİçeriği
}
