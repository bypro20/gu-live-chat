'use client'

import { useEffect, useState } from 'react'
import { GU_BRAND } from '@/lib/brand-theme'
import { useLocale } from '@/components/marketing/locale-provider'

/** Technoai tarzı animasyonlu AI destek robotu — Gu Meridian renkleri */
export function HeroRobot() {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => {
      setBlink(true)
      window.setTimeout(() => setBlink(false), 140)
    }, 3400)
    return () => window.clearInterval(id)
  }, [])

  const bubble =
    lang === 'en'
      ? 'Hi! How can I help you today?'
      : 'Merhaba! Size nasıl yardımcı olabilirim?'

  return (
    <div className="technoai-robot-scene relative w-full max-w-[520px] mx-auto lg:mx-0 lg:ml-auto aspect-square">
      {/* Glow backdrop */}
      <div
        className="absolute inset-[12%] rounded-full blur-3xl opacity-60 pointer-events-none technoai-robot-glow"
        style={{
          background: `radial-gradient(circle, ${GU_BRAND.primaryGlow} 0%, transparent 70%)`,
        }}
      />

      {/* Floating rings */}
      <div className="technoai-pulse-ring absolute top-[8%] right-[10%] w-24 h-24 rounded-full border border-primary/30" />
      <div className="technoai-pulse-ring absolute bottom-[18%] left-[6%] w-16 h-16 rounded-full border border-[#C9922E]/35 animation-delay-700" />

      {/* Chat bubble */}
      <div className="technoai-float absolute top-[6%] left-[4%] sm:left-[8%] z-20 max-w-[200px]">
        <div className="rounded-2xl rounded-bl-sm bg-white/95 backdrop-blur-sm border border-white/60 px-4 py-3 shadow-xl shadow-black/10">
          <p className="text-[11px] sm:text-xs font-medium text-foreground leading-snug">{bubble}</p>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="technoai-typing-dot w-1.5 h-1.5 rounded-full bg-primary"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* AI badge */}
      <div className="technoai-float-reverse absolute bottom-[12%] right-[4%] z-20 rounded-xl bg-primary/90 backdrop-blur px-3 py-2 shadow-lg border border-white/10">
        <p className="text-[10px] font-bold text-white uppercase tracking-wider">AI Agent</p>
        <p className="text-[9px] text-white/75 mt-0.5">{lang === 'en' ? 'Online 24/7' : '7/24 Çevrimiçi'}</p>
      </div>

      {/* Robot SVG */}
      <svg
        viewBox="0 0 400 400"
        className="technoai-robot-float relative z-10 w-full h-full drop-shadow-2xl"
        aria-hidden
      >
        <defs>
          <linearGradient id="gu-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GU_BRAND.primary} />
            <stop offset="55%" stopColor={GU_BRAND.success} />
            <stop offset="100%" stopColor={GU_BRAND.primaryHover} />
          </linearGradient>
          <linearGradient id="gu-head" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E8E4DE" />
          </linearGradient>
          <linearGradient id="gu-screen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0A4038" />
            <stop offset="100%" stopColor={GU_BRAND.primary} />
          </linearGradient>
          <filter id="gu-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="200" cy="355" rx="90" ry="12" fill="rgba(20,99,86,0.18)" />

        {/* Left arm */}
        <g className="technoai-arm-left origin-[120px_240px]">
          <rect x="72" y="218" width="28" height="72" rx="14" fill="url(#gu-body)" />
          <circle cx="86" cy="298" r="18" fill="url(#gu-body)" stroke="#fff" strokeWidth="2" opacity="0.9" />
        </g>

        {/* Right arm */}
        <g className="technoai-arm-right origin-[280px_240px]">
          <rect x="300" y="218" width="28" height="72" rx="14" fill="url(#gu-body)" />
          <circle cx="314" cy="298" r="18" fill="url(#gu-body)" stroke="#fff" strokeWidth="2" opacity="0.9" />
        </g>

        {/* Body */}
        <rect x="128" y="210" width="144" height="120" rx="28" fill="url(#gu-body)" />
        <rect x="148" y="232" width="104" height="76" rx="16" fill="rgba(255,255,255,0.12)" />
        <circle cx="200" cy="270" r="22" fill={GU_BRAND.accent} opacity="0.95" filter="url(#gu-glow)" />
        <text x="200" y="276" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700" fontFamily="system-ui,sans-serif">
          GU
        </text>

        {/* Head */}
        <rect x="108" y="88" width="184" height="138" rx="36" fill="url(#gu-head)" stroke="#D4CFC6" strokeWidth="2" />
        {/* Antenna */}
        <line x1="200" y1="88" x2="200" y2="52" stroke={GU_BRAND.primary} strokeWidth="4" strokeLinecap="round" />
        <circle cx="200" cy="44" r="10" fill={GU_BRAND.accent} className="technoai-antenna-pulse" filter="url(#gu-glow)" />

        {/* Face screen */}
        <rect x="128" y="108" width="144" height="96" rx="22" fill="url(#gu-screen)" />
        {/* Eyes / chat dots */}
        <g className={blink ? 'technoai-robot-blink' : ''}>
          <circle cx="168" cy="152" r="10" fill="#3DBDA5" />
          <circle cx="200" cy="152" r="10" fill="#3DBDA5" />
          <circle cx="232" cy="152" r="10" fill="#3DBDA5" />
        </g>
        {/* Smile arc */}
        <path
          d="M 160 178 Q 200 200 240 178"
          fill="none"
          stroke="#3DBDA5"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Ear panels */}
        <rect x="88" y="128" width="18" height="48" rx="9" fill={GU_BRAND.primary} opacity="0.85" />
        <rect x="294" y="128" width="18" height="48" rx="9" fill={GU_BRAND.primary} opacity="0.85" />

        {/* Legs */}
        <rect x="152" y="322" width="36" height="28" rx="10" fill={GU_BRAND.primaryHover} />
        <rect x="212" y="322" width="36" height="28" rx="10" fill={GU_BRAND.primaryHover} />
      </svg>
    </div>
  )
}
