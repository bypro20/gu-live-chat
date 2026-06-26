/** Agent inbox UI tokens — aligned with lib/widget-theme.ts */

import type { CSSProperties } from 'react'
import { adjustColor, hexToRgba, WIDGET_FONT } from '@/lib/widget-theme'

import { GU_BRAND } from '@/lib/brand-theme'

export const INBOX_DEFAULT_PRIMARY = GU_BRAND.primary

export function resolveInboxPrimary(color?: string | null): string {
  if (color && /^#[0-9A-Fa-f]{3,8}$/.test(color)) return color
  return INBOX_DEFAULT_PRIMARY
}

export function inboxFontStyle(): CSSProperties {
  return { fontFamily: WIDGET_FONT }
}

export function inboxAgentBubbleStyle(primary: string): CSSProperties {
  return {
    background: `linear-gradient(155deg, ${adjustColor(primary, 12)} 0%, ${primary} 52%, ${adjustColor(primary, -18)} 100%)`,
    color: '#ffffff',
    boxShadow: `0 1px 2px ${hexToRgba(primary, 0.14)}, 0 4px 14px ${hexToRgba(primary, 0.2)}`,
  }
}

export function inboxVisitorBubbleStyle(): CSSProperties {
  return {
    background: 'var(--card)',
    color: 'var(--foreground)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xs)',
  }
}

/** iMessage-style grouped bubble corners */
export function inboxBubbleRadius(isVisitor: boolean, grouped: boolean, isLastInGroup: boolean): string {
  if (isVisitor) {
    if (!grouped && isLastInGroup) return 'rounded-[6px_20px_20px_20px]'
    if (!grouped) return 'rounded-[6px_20px_6px_20px]'
    if (isLastInGroup) return 'rounded-[6px_20px_20px_20px]'
    return 'rounded-[6px_6px_6px_20px]'
  }
  if (!grouped && isLastInGroup) return 'rounded-[20px_6px_20px_20px]'
  if (!grouped) return 'rounded-[20px_6px_20px_6px]'
  if (isLastInGroup) return 'rounded-[20px_6px_20px_20px]'
  return 'rounded-[6px_6px_20px_6px]'
}

export function inboxHeaderStyle(primary: string): CSSProperties {
  return {
    background: `linear-gradient(155deg, ${hexToRgba(primary, 0.92)} 0%, ${primary} 42%, ${hexToRgba(primary, 0.85)} 100%)`,
    color: '#fff',
  }
}

export function inboxComposerShellStyle(): CSSProperties {
  return {
    background: 'color-mix(in srgb, var(--card) 97%, transparent)',
    borderTop: '1px solid var(--border)',
    backdropFilter: 'blur(12px)',
  }
}

export function inboxComposerRowStyle(primary: string): CSSProperties {
  return {
    background: 'var(--card)',
    border: `1px solid ${hexToRgba(primary, 0.12)}`,
    boxShadow: `0 2px 12px ${hexToRgba(primary, 0.06)}`,
  }
}
