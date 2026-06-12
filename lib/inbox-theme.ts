/** Agent inbox UI tokens — aligned with lib/widget-theme.ts */

import type { CSSProperties } from 'react'
import { auroraGradient, hexToRgba, WIDGET_FONT } from '@/lib/widget-theme'

export const INBOX_DEFAULT_PRIMARY = '#6366F1'

export function resolveInboxPrimary(color?: string | null): string {
  if (color && /^#[0-9A-Fa-f]{3,8}$/.test(color)) return color
  return INBOX_DEFAULT_PRIMARY
}

export function inboxFontStyle(): CSSProperties {
  return { fontFamily: WIDGET_FONT }
}

export function inboxAgentBubbleStyle(primary: string): CSSProperties {
  return {
    background: auroraGradient(primary),
    backgroundSize: '200% 200%',
    color: '#ffffff',
    boxShadow: `0 10px 28px ${hexToRgba(primary, 0.38)}`,
  }
}

export function inboxVisitorBubbleStyle(): CSSProperties {
  return {
    background: '#ffffff',
    color: '#0F172A',
    border: '1px solid rgba(99,102,241,0.12)',
    boxShadow: '0 6px 20px rgba(99,102,241,0.08)',
  }
}

export function inboxHeaderStyle(primary: string): CSSProperties {
  return {
    background: `linear-gradient(155deg, ${hexToRgba(primary, 0.92)} 0%, ${primary} 42%, ${hexToRgba(primary, 0.85)} 100%)`,
    color: '#fff',
  }
}

export function inboxComposerShellStyle(): CSSProperties {
  return {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(238,242,255,0.96) 100%)',
    borderTop: '1px solid rgba(99,102,241,0.1)',
  }
}

export function inboxComposerRowStyle(primary: string): CSSProperties {
  return {
    background: '#ffffff',
    border: `2px solid ${hexToRgba(primary, 0.14)}`,
    boxShadow: `0 8px 32px ${hexToRgba(primary, 0.1)}, inset 0 1px 0 rgba(255,255,255,1)`,
  }
}
