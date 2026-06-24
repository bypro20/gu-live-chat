export const PLATFORM_THEME_KEY = 'platform_theme'

export type PlatformTheme = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  border: string
  accent: string
  accentForeground: string
}

export const DEFAULT_PLATFORM_THEME: PlatformTheme = {
  background: '#ffffff',
  foreground: '#000000',
  card: '#ffffff',
  cardForeground: '#000000',
  muted: '#f5f5f5',
  mutedForeground: '#404040',
  border: '#e5e5e5',
  accent: '#dc2626',
  accentForeground: '#ffffff',
}

export const PLATFORM_THEME_PRESETS: Record<string, { label: string; theme: PlatformTheme }> = {
  classic: {
    label: 'Beyaz · Siyah · Kırmızı',
    theme: DEFAULT_PLATFORM_THEME,
  },
  purple: {
    label: 'Mor (varsayılan marka)',
    theme: {
      background: '#f8fafc',
      foreground: '#111827',
      card: '#ffffff',
      cardForeground: '#111827',
      muted: '#f9fafb',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      accent: '#9333ea',
      accentForeground: '#ffffff',
    },
  },
  ocean: {
    label: 'Mavi',
    theme: {
      background: '#f8fafc',
      foreground: '#0f172a',
      card: '#ffffff',
      cardForeground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#475569',
      border: '#e2e8f0',
      accent: '#2563eb',
      accentForeground: '#ffffff',
    },
  },
}

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

export function isValidHexColor(value: string): boolean {
  return HEX_RE.test(value.trim())
}

function expandHex(hex: string): string {
  const h = hex.trim()
  if (h.length === 4) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  }
  return h
}

export function normalizePlatformTheme(input: Partial<PlatformTheme> | null | undefined): PlatformTheme {
  const base = { ...DEFAULT_PLATFORM_THEME }
  if (!input || typeof input !== 'object') return base

  for (const key of Object.keys(base) as Array<keyof PlatformTheme>) {
    const value = input[key]
    if (typeof value === 'string' && isValidHexColor(value)) {
      base[key] = expandHex(value)
    }
  }
  return base
}

/** Tüm panellere uygulanacak CSS değişkenleri */
export function buildPlatformThemeCss(theme: PlatformTheme): string {
  const accentHover = `color-mix(in srgb, ${theme.accent} 82%, #000000 18%)`
  const accentSoft = `color-mix(in srgb, ${theme.accent} 12%, ${theme.background} 88%)`
  const sidebarActive = `color-mix(in srgb, ${theme.accent} 10%, ${theme.background} 90%)`
  const primaryLight = `color-mix(in srgb, ${theme.accent} 14%, ${theme.background} 86%)`
  const ring = theme.accent

  return `
:root, .dark {
  --background: ${theme.background};
  --foreground: ${theme.foreground};
  --card: ${theme.card};
  --card-foreground: ${theme.cardForeground};
  --popover: ${theme.card};
  --popover-foreground: ${theme.cardForeground};
  --primary: ${theme.accent};
  --primary-foreground: ${theme.accentForeground};
  --primary-hover: ${accentHover};
  --primary-active: ${accentHover};
  --primary-light: ${primaryLight};
  --primary-glow: color-mix(in srgb, ${theme.accent} 22%, transparent);
  --muted: ${theme.muted};
  --muted-foreground: ${theme.mutedForeground};
  --accent: ${theme.muted};
  --accent-foreground: ${theme.foreground};
  --border: ${theme.border};
  --border-strong: color-mix(in srgb, ${theme.border} 70%, ${theme.foreground} 30%);
  --input: ${theme.border};
  --ring: ${ring};
  --destructive: ${theme.accent};
  --destructive-foreground: ${theme.accentForeground};
  --sidebar-bg: ${theme.background};
  --sidebar-bg-end: ${theme.muted};
  --sidebar-foreground: ${theme.mutedForeground};
  --sidebar-foreground-active: ${theme.foreground};
  --sidebar-title: ${theme.foreground};
  --sidebar-active: ${sidebarActive};
  --sidebar-active-border: ${theme.accent};
  --sidebar-border: ${theme.border};
  --sidebar-hover: ${accentSoft};
  --sidebar-surface: ${theme.muted};
  --sidebar-group-label: ${theme.mutedForeground};
}

.admin-shell-v2,
.admin-overlay-host {
  --admin-bg: ${theme.background};
  --admin-bg-subtle: ${theme.muted};
  --admin-bg-elevated: ${theme.muted};
  --admin-bg-card: ${theme.card};
  --admin-bg-hover: ${theme.muted};
  --admin-border: ${theme.border};
  --admin-border-strong: color-mix(in srgb, ${theme.border} 70%, ${theme.foreground} 30%);
  --admin-text: ${theme.foreground};
  --admin-text-secondary: color-mix(in srgb, ${theme.foreground} 90%, ${theme.background} 10%);
  --admin-text-muted: ${theme.mutedForeground};
  --admin-text-faint: color-mix(in srgb, ${theme.mutedForeground} 75%, ${theme.background} 25%);
  --admin-accent: ${theme.accent};
  --admin-accent-hover: ${accentHover};
  --admin-accent-soft: ${accentSoft};
  --admin-accent-fg: ${theme.accentForeground};
  --admin-topbar-bg: ${theme.background};
  --admin-input-bg: ${theme.card};
  --admin-sidebar-bg: ${theme.background};
  --admin-sidebar-bg-end: ${theme.background};
  --admin-sidebar-active: ${sidebarActive};
  color-scheme: light;
}
`.trim()
}

export const PLATFORM_THEME_STYLE_ID = 'platform-theme-vars'

export function applyPlatformThemeToDocument(theme: PlatformTheme) {
  if (typeof document === 'undefined') return
  const css = buildPlatformThemeCss(theme)
  let el = document.getElementById(PLATFORM_THEME_STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = PLATFORM_THEME_STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

export const PLATFORM_THEME_UPDATED_EVENT = 'platform-theme-updated'
