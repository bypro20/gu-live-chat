'use client'

import { useLocale } from '@/components/marketing/locale-provider'

const DEMO_VIDEO = '/gulivechat-panel-demo-tr.mp4'

/** Ana sayfa / about — panel demo videosu */
export function PanelDemoVideo({ className = '' }: { className?: string }) {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-[#121110] ${className}`}
    >
      <video
        className="w-full aspect-video object-contain bg-[#0a0a09]"
        controls
        playsInline
        preload="metadata"
        aria-label={lang === 'en' ? 'Gu Live Chat panel tour video' : 'Gu Live Chat panel turu videosu'}
      >
        <source src={DEMO_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-white/60 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#C9922E] animate-pulse" aria-hidden />
        <span className="text-[11px] font-bold text-[#121110] tracking-wide">
          {lang === 'en' ? 'Panel tour · 50 sec' : 'Panel turu · ~50 sn'}
        </span>
      </div>
    </div>
  )
}
