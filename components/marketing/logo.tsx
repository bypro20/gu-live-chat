'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { LogoMark } from '@/components/brand/logo-mark'

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
      <LogoMark size={ayar.svg} glow={animasyonlu} />
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
