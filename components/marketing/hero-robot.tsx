'use client'

import { useLocale } from '@/components/marketing/locale-provider'

/** Technoai hero — yüzen AI sohbet balonu (robot sağda arka planda) */
export function HeroRobotOverlays() {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'
  const bubble =
    lang === 'en'
      ? 'Hi! How can I help you today?'
      : 'Merhaba! Size nasıl yardımcı olabilirim?'

  return (
    <div className="technoai-hero-overlays hidden lg:block" aria-hidden>
      <div className="technoai-float absolute top-[18%] right-[8%] z-20 max-w-[220px]">
        <div className="rounded-2xl rounded-br-sm bg-white/95 backdrop-blur-md border border-cyan-400/20 px-4 py-3 shadow-[0_20px_50px_-12px_rgba(0,212,255,0.25)]">
          <p className="text-xs font-medium text-[#121110] leading-snug">{bubble}</p>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="technoai-typing-dot w-1.5 h-1.5 rounded-full bg-[#00D4FF]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="technoai-float-reverse absolute bottom-[22%] right-[14%] z-20 rounded-xl px-3 py-2 shadow-lg border border-cyan-400/30 bg-[#0a1628]/85 backdrop-blur-sm">
        <p className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider">AI Agent</p>
        <p className="text-[9px] text-white/70 mt-0.5">{lang === 'en' ? 'Online 24/7' : '7/24 Çevrimiçi'}</p>
      </div>
      <div className="technoai-pulse-ring absolute top-[32%] right-[24%] w-24 h-24 rounded-full border border-cyan-400/30" />
      <div className="technoai-pulse-ring absolute top-[38%] right-[20%] w-32 h-32 rounded-full border border-[#029b9b]/20 [animation-delay:0.7s]" />
    </div>
  )
}
