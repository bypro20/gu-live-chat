'use client'

import { useCallback, useState } from 'react'
import { useLocale } from '@/components/marketing/locale-provider'

const SCENES = [
  '/marketing/panel-demo/01-intro-silent.mp4',
  '/marketing/panel-demo/02-overview-silent.mp4',
  '/marketing/panel-demo/03-inbox-silent.mp4',
  '/marketing/panel-demo/04-visitors-silent.mp4',
  '/marketing/panel-demo/05-widget-silent.mp4',
  '/marketing/panel-demo/06-automation-silent.mp4',
  '/marketing/panel-demo/07-cta-silent.mp4',
] as const

/** Sessiz panel demo — sahneler arası geçiş, ses yok */
export function SilentPanelDemoVideo({ className = '' }: { className?: string }) {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'
  const [scene, setScene] = useState(0)

  const onEnded = useCallback(() => {
    setScene((i) => (i + 1) % SCENES.length)
  }, [])

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-[#121110] ${className}`}
    >
      <video
        key={SCENES[scene]}
        className="w-full aspect-[9/16] sm:aspect-video object-cover bg-[#0a0a09]"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onEnded}
        aria-label={lang === 'en' ? 'Gu Live Chat silent panel demo' : 'Gu Live Chat sessiz panel demosu'}
      >
        <source src={SCENES[scene]} type="video/mp4" />
      </video>
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-white/60 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#9333EA] animate-pulse" aria-hidden />
        <span className="text-[11px] font-bold text-[#121110] tracking-wide">
          {lang === 'en'
            ? `Panel demo · ${scene + 1}/${SCENES.length} · silent`
            : `Panel demo · ${scene + 1}/${SCENES.length} · sessiz`}
        </span>
      </div>
    </div>
  )
}
