'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LogoMark } from './logo-mark'

type AppLogoVariant = 'sidebar' | 'light' | 'admin'

interface AppLogoProps {
  variant?: AppLogoVariant
  href?: string
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { mark: 32, title: 'text-[13px]', tag: 'text-[9px]', gap: 'gap-2.5' },
  md: { mark: 38, title: 'text-[15px]', tag: 'text-[10px]', gap: 'gap-3' },
  lg: { mark: 44, title: 'text-lg', tag: 'text-[11px]', gap: 'gap-3' },
}

export function AppLogo({
  variant = 'sidebar',
  href,
  showTagline = true,
  size = 'md',
  className,
}: AppLogoProps) {
  const s = sizes[size]
  const isSidebar = variant === 'sidebar' || variant === 'admin'
  const isAdmin = variant === 'admin'

  const content = (
    <div className={cn('flex items-center group', s.gap, className)}>
      <LogoMark size={s.mark} glow={isSidebar} className="transition-transform duration-300 group-hover:scale-[1.03]" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              s.title,
              'font-bold tracking-tight leading-none',
              isSidebar ? 'text-white' : 'text-foreground'
            )}
          >
            Gu <span className={isSidebar ? 'text-[#93C5FD]' : 'text-primary'}>Chat</span>
          </span>
          {isAdmin && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-violet-500/20 text-violet-300 border border-violet-400/25">
              Admin
            </span>
          )}
          {isSidebar && !isAdmin && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
          )}
        </div>
        {showTagline && (
          <p
            className={cn(
              s.tag,
              'mt-1 tracking-wide truncate',
              isSidebar ? 'text-white/45' : 'text-muted-foreground'
            )}
          >
            {isAdmin ? 'Platform Yönetimi' : 'Canlı Destek Platformu'}
          </p>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}
