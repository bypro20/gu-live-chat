'use client'

import { cn } from '@/lib/utils'

interface LogoMarkProps {
  size?: number
  className?: string
  glow?: boolean
}

/** Gu Live Chat mark — gradient kutu + sohbet balonu + AI vurgusu */
export function LogoMark({ size = 40, className, glow = false }: LogoMarkProps) {
  const id = `gu-mark-${size}`
  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-[22%] opacity-60 blur-md"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
          aria-hidden
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className="relative"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${id}-bg`} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="55%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="8" y1="6" x2="28" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1D4ED8" floodOpacity="0.35" />
          </filter>
        </defs>
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill={`url(#${id}-bg)`}
          filter={`url(#${id}-shadow)`}
        />
        <rect x="2" y="2" width="44" height="22" rx="12" fill={`url(#${id}-shine)`} />
        <path
          d="M24 9.5h7.5a3.2 3.2 0 0 1 3.2 3.2v2.8a3.2 3.2 0 0 1-3.2 3.2H28l-2.8 2.8V18.7H24a3.2 3.2 0 0 1-3.2-3.2v-2.8a3.2 3.2 0 0 1 3.2-3.2z"
          fill="white"
          fillOpacity="0.22"
        />
        <path
          d="M12.5 16.5h16.5a3.2 3.2 0 0 1 3.2 3.2v7.2a3.2 3.2 0 0 1-3.2 3.2h-4.2l-5.2 5.2v-5.2h-7.5a3.2 3.2 0 0 1-3.2-3.2v-7.2a3.2 3.2 0 0 1 3.2-3.2z"
          fill="white"
          fillOpacity="0.96"
        />
        <path
          d="M21.5 19.5l-3.2 4.2h2.2l-1.1 4.5 5.4-5.4h-2.3l1-3.3z"
          fill="#2563EB"
        />
        <circle cx="36" cy="12" r="2.5" fill="#93C5FD" fillOpacity="0.9" />
        <circle cx="36" cy="12" r="1" fill="white" fillOpacity="0.8" />
      </svg>
    </div>
  )
}
