'use client'

import {
  agentBubbleStyle,
  auroraGradient,
  brandGradient,
  getComposerRowStyle,
  getHeroHeaderStyle,
  getLauncherStyle,
  getPanelShellStyle,
  getTeaserCardStyle,
  getTrustBadgeStyle,
  getTrustStripStyle,
  getWidgetGlobalCss,
  hexToRgba,
  quickChipStyle,
  visitorBubbleStyle,
  WIDGET_FONT,
} from '@/lib/widget-theme'

type WidgetLivePreviewProps = {
  primaryColor: string
  websiteName: string
  domain?: string | null
  welcomeMessage: string
  onlineLabel: string
  typeMessageLabel: string
  quickLabels?: [string, string, string]
}

export function WidgetLivePreview({
  primaryColor,
  websiteName,
  domain,
  welcomeMessage,
  onlineLabel,
  typeMessageLabel,
  quickLabels = ['💬 Sohbet', '💰 Fiyat', '🛟 Destek'],
}: WidgetLivePreviewProps) {
  const initials = websiteName.slice(0, 2).toUpperCase()

  return (
    <div
      className="rounded-2xl p-5 sm:p-8 min-h-[620px] flex items-end justify-end relative overflow-hidden border border-indigo-500/20"
      style={{
        fontFamily: WIDGET_FONT,
        background: 'linear-gradient(160deg, #0B1020 0%, #1E1B4B 40%, #312E81 100%)',
      }}
    >
      <style>{getWidgetGlobalCss()}</style>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 15%, ${hexToRgba(primaryColor, 0.45)}, transparent 42%), radial-gradient(circle at 85% 8%, rgba(139,92,246,0.35), transparent 38%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.2), transparent 50%)`,
        }}
      />
      <div className="absolute top-4 left-4 text-xs text-white/40 font-medium z-10 tracking-wide uppercase">
        {domain || websiteName}
      </div>

      {/* Teaser card — dikkat çekici davet */}
      <div
        className="absolute z-20 right-5 sm:right-8"
        style={{ bottom: 108, ...getTeaserCardStyle(primaryColor) }}
      >
        <div
          style={{
            height: 5,
            background: auroraGradient(primaryColor),
            backgroundSize: '200% 100%',
            animation: 'gwShimmer 3s ease infinite',
          }}
        />
        <div className="p-5">
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="relative shrink-0">
              <div
                className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white font-extrabold text-base"
                style={{
                  background: brandGradient(primaryColor),
                  boxShadow: `0 10px 28px ${hexToRgba(primaryColor, 0.4)}`,
                  border: '2px solid rgba(255,255,255,0.5)',
                }}
              >
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>
            <div>
              <p className="font-extrabold text-base text-slate-900 tracking-tight m-0">{websiteName}</p>
              <p className="text-emerald-600 text-xs font-semibold mt-1 m-0">🟢 {onlineLabel} · ~30 sn</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed m-0 mb-4">{welcomeMessage}</p>
          <button
            type="button"
            className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2"
            style={{
              background: brandGradient(primaryColor),
              boxShadow: `0 10px 28px ${hexToRgba(primaryColor, 0.45)}`,
            }}
          >
            💬 Hemen sohbet et →
          </button>
          <p className="text-center text-[10px] text-slate-400 font-semibold tracking-widest mt-2.5 m-0">
            ÜCRETSİZ · ANINDA · GÜVENLİ
          </p>
        </div>
      </div>

      {/* Open panel preview */}
      <div className="relative z-10 mb-28 mr-1 hidden xl:block" style={getPanelShellStyle(primaryColor, false)}>
        <div style={getHeroHeaderStyle(primaryColor)}>
          <div className="absolute rounded-full pointer-events-none" style={{ top: -48, right: -36, width: 140, height: 140, background: 'rgba(255,255,255,0.14)' }} />
          <div className="relative flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.45)' }}
            >
              {initials}
            </div>
            <div>
              <p className="text-white font-bold text-[15px] m-0">{websiteName}</p>
              <p className="text-white/85 text-xs m-0 mt-0.5">🟢 {onlineLabel}</p>
            </div>
          </div>
          <div style={getTrustStripStyle()}>
            {['⚡ Anında', '🔒 Güvenli', '✨ Ücretsiz'].map((b) => (
              <span key={b} style={getTrustBadgeStyle()}>{b}</span>
            ))}
          </div>
          <div className="relative flex gap-2 mt-3 flex-wrap">
            {quickLabels.map((label) => (
              <span key={label} style={quickChipStyle()}>{label}</span>
            ))}
          </div>
        </div>
        <div className="gw-dot-bg p-4 space-y-3" style={{ minHeight: 120 }}>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold text-white" style={{ background: brandGradient(primaryColor) }}>AI</div>
            <div style={{ ...agentBubbleStyle(), maxWidth: 240 }}>{welcomeMessage}</div>
          </div>
          <div className="flex justify-end">
            <div style={{ ...visitorBubbleStyle(primaryColor), maxWidth: 180 }}>Merhaba 👋</div>
          </div>
        </div>
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={getComposerRowStyle(primaryColor)}>
            <div className="flex-1 py-2.5 text-xs text-slate-400">{typeMessageLabel}</div>
            <button type="button" className="w-10 h-10 rounded-[16px] flex items-center justify-center text-white shrink-0" style={{ background: auroraGradient(primaryColor), boxShadow: `0 6px 20px ${hexToRgba(primaryColor, 0.45)}` }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Launcher dock */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-3">
        <div
          className="hidden sm:block px-4 py-2.5 rounded-full text-xs font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
            animation: 'gwFloat 3s ease-in-out infinite',
          }}
        >
          🟢 Canlı destek açık
        </div>
        <div className="relative">
          <div className="absolute -inset-1 rounded-[28px] pointer-events-none" style={{ animation: 'gwRing 2s ease-out infinite', border: `2px solid ${hexToRgba(primaryColor, 0.55)}` }} />
          <div className="absolute -inset-2 rounded-[32px] pointer-events-none" style={{ animation: 'gwRing2 2s ease-out 1s infinite', border: `2px solid ${hexToRgba(primaryColor, 0.3)}` }} />
          <div style={getLauncherStyle(primaryColor)} className="flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path strokeLinecap="round" d="M9 10h6" /><path strokeLinecap="round" d="M9 14h4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
