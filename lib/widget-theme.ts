/** Shared widget design — embed launcher, iframe panel, dashboard preview. */

export const WIDGET_ASSET_VERSION = '2026.06.12b'

export function adjustColor(hex: string, amount: number): string {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export const WIDGET_FONT =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

export function brandGradient(primary: string): string {
  return `linear-gradient(135deg, ${adjustColor(primary, 55)} 0%, ${primary} 40%, ${adjustColor(primary, -40)} 100%)`
}

export function heroGradient(primary: string): string {
  return `linear-gradient(155deg, ${adjustColor(primary, 35)} 0%, ${primary} 35%, ${adjustColor(primary, -50)} 100%)`
}

export function auroraGradient(primary: string): string {
  return `linear-gradient(135deg, ${adjustColor(primary, 60)} 0%, ${primary} 25%, #8B5CF6 55%, ${adjustColor(primary, -30)} 100%)`
}

export function getWidgetGlobalCss(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @keyframes gwSlideUp {
      from { opacity: 0; transform: translateY(32px) scale(0.92); filter: blur(8px); }
      to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    @keyframes gwFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes gwBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30%            { transform: translateY(-6px); }
    }
    @keyframes gwCheckIn {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes gwRing {
      0%   { transform: scale(1); opacity: 0.65; }
      100% { transform: scale(1.55); opacity: 0; }
    }
    @keyframes gwRing2 {
      0%   { transform: scale(1); opacity: 0.4; }
      100% { transform: scale(1.85); opacity: 0; }
    }
    @keyframes gwFloat {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-6px); }
    }
    @keyframes gwGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.4), 0 0 60px rgba(25,114,245,0.25); }
      50%      { box-shadow: 0 0 30px rgba(139,92,246,0.55), 0 0 80px rgba(25,114,245,0.35); }
    }
    @keyframes gwShimmer {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes gwWiggle {
      0%, 100% { transform: rotate(0deg); }
      25%      { transform: rotate(-4deg); }
      75%      { transform: rotate(4deg); }
    }
    .gw-scroll::-webkit-scrollbar       { width: 5px; }
    .gw-scroll::-webkit-scrollbar-track { background: transparent; }
    .gw-scroll::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.14); border-radius: 8px; }
    .gw-input::placeholder { color: #94A3B8 !important; opacity: 1; }
    .gw-msg-btn:hover { opacity: 1 !important; }
    .gw-dot-bg {
      background-color: #EEF2FF;
      background-image:
        radial-gradient(rgba(99,102,241,0.12) 1px, transparent 1px),
        linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(238,242,255,0.3) 100%);
      background-size: 20px 20px, 100% 100%;
    }
    .gw-panel-glow {
      position: relative;
    }
    .gw-panel-glow::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 30px;
      background: linear-gradient(135deg, #60A5FA, #818CF8, #A78BFA, #60A5FA);
      background-size: 300% 300%;
      animation: gwShimmer 4s ease infinite;
      z-index: -1;
      opacity: 0.85;
    }
    @media (max-width: 480px) {
      .gw-panel   { width: 100vw !important; max-height: 100dvh !important; height: 100dvh !important; border-radius: 0 !important; }
      .gw-wrapper { bottom: 0 !important; right: 0 !important; width: 100% !important; height: 100% !important; }
    }
  `
}

export function getPanelShellStyle(primaryColor: string, embedded = false): Record<string, string | number> {
  const glow = hexToRgba(primaryColor, 0.28)
  const base = {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: embedded ? 'none' : `2px solid ${hexToRgba(primaryColor, 0.22)}`,
    boxShadow: embedded
      ? 'none'
      : `0 0 0 1px rgba(255,255,255,0.8) inset, 0 50px 100px -28px rgba(15,23,42,0.42), 0 0 80px ${glow}, 0 0 120px ${hexToRgba(primaryColor, 0.12)}`,
    animation: embedded ? 'none' : 'gwSlideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
  }
  if (embedded) {
    return { ...base, width: '100%', height: '100%', maxHeight: '100%', borderRadius: 0, background: '#ffffff' }
  }
  return {
    ...base,
    width: '440px',
    maxHeight: '680px',
    height: 'calc(100dvh - 64px)',
    borderRadius: '30px',
    background: '#ffffff',
  }
}

export function getHeroHeaderStyle(primaryColor: string): Record<string, string | number> {
  return {
    padding: '24px 22px 22px',
    background: heroGradient(primaryColor),
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  }
}

export function getTrustStripStyle(): Record<string, string | number> {
  return {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '14px',
    position: 'relative',
    zIndex: 1,
  }
}

export function getTrustBadgeStyle(): Record<string, string | number> {
  return {
    padding: '5px 10px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  }
}

export function getMessagesAreaStyle(): Record<string, string | number> {
  return {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '18px 18px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }
}

export function getComposerShellStyle(): Record<string, string | number> {
  return {
    padding: '12px 16px 16px',
    borderTop: '1px solid rgba(99,102,241,0.1)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(238,242,255,0.95) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    flexShrink: 0,
    position: 'relative',
  }
}

export function getComposerRowStyle(primaryColor: string): Record<string, string | number> {
  return {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    padding: '8px 10px 8px 14px',
    borderRadius: '24px',
    background: '#ffffff',
    border: `2px solid ${hexToRgba(primaryColor, 0.15)}`,
    boxShadow: `0 8px 32px ${hexToRgba(primaryColor, 0.12)}, inset 0 1px 0 rgba(255,255,255,1)`,
  }
}

export function getLauncherStyle(primaryColor: string): Record<string, string | number> {
  return {
    width: '76px',
    height: '76px',
    borderRadius: '24px',
    background: auroraGradient(primaryColor),
    backgroundSize: '200% 200%',
    animation: 'gwFloat 2.8s ease-in-out infinite, gwShimmer 5s ease infinite',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 20px 56px ${hexToRgba(primaryColor, 0.55)}, 0 0 0 2px rgba(255,255,255,0.35) inset, 0 0 40px ${hexToRgba(primaryColor, 0.35)}`,
    transition: 'all 0.28s cubic-bezier(0.16,1,0.3,1)',
    position: 'relative',
  }
}

export function visitorBubbleStyle(primaryColor: string): Record<string, string | number> {
  return {
    background: auroraGradient(primaryColor),
    backgroundSize: '200% 200%',
    color: '#ffffff',
    borderRadius: '22px 8px 22px 22px',
    padding: '13px 17px',
    fontSize: '14px',
    lineHeight: 1.65,
    fontWeight: 500,
    boxShadow: `0 10px 28px ${hexToRgba(primaryColor, 0.4)}`,
  }
}

export function agentBubbleStyle(): Record<string, string | number> {
  return {
    background: '#ffffff',
    borderRadius: '8px 22px 22px 22px',
    padding: '13px 17px',
    fontSize: '14px',
    lineHeight: 1.65,
    color: '#0F172A',
    border: '1px solid rgba(99,102,241,0.12)',
    boxShadow: '0 6px 20px rgba(99,102,241,0.08)',
  }
}

export function quickChipStyle(): Record<string, string | number> {
  return {
    padding: '9px 16px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.22)',
    border: '1.5px solid rgba(255,255,255,0.35)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'all 0.15s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  }
}

export function getTeaserCardStyle(primaryColor: string): Record<string, string | number> {
  return {
    width: '340px',
    maxWidth: 'calc(100vw - 32px)',
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `2px solid ${hexToRgba(primaryColor, 0.2)}`,
    boxShadow: `0 32px 64px -16px rgba(15,23,42,0.28), 0 0 60px ${hexToRgba(primaryColor, 0.18)}`,
    overflow: 'hidden',
    cursor: 'pointer',
    animation: 'gwSlideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
  }
}
