export const PLATFORM_THEME_KEY = 'platform_theme'

/** Tek panel renk paleti */
export type PanelTheme = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  border: string
  accent: string
  accentForeground: string
  /** Menü ve liste öğeleri üzerine gelince */
  hover: string
}

/** @deprecated PanelTheme ile aynı — geriye uyumluluk */
export type PlatformTheme = PanelTheme

export type PlatformThemes = {
  /** Admin paneli — açık tema */
  admin: PanelTheme
  /** Admin paneli — koyu tema (geçiş düğmesi ile) */
  adminDark: PanelTheme
  /** Müşteri paneli — açık tema (:root) */
  customer: PanelTheme
  /** Müşteri paneli — koyu tema (.dark); kullanıcı geçişi isteğe bağlı */
  customerDark: PanelTheme
}

export const DEFAULT_ADMIN_THEME: PanelTheme = {
  background: '#ffffff',
  foreground: '#000000',
  card: '#ffffff',
  cardForeground: '#000000',
  muted: '#f5f5f5',
  mutedForeground: '#404040',
  border: '#e5e5e5',
  accent: '#dc2626',
  accentForeground: '#ffffff',
  hover: '#f5f5f5',
}

export const DEFAULT_ADMIN_DARK_THEME: PanelTheme = {
  background: '#000000',
  foreground: '#ffffff',
  card: '#0a0a0a',
  cardForeground: '#ffffff',
  muted: '#171717',
  mutedForeground: '#a3a3a3',
  border: '#262626',
  accent: '#dc2626',
  accentForeground: '#ffffff',
  hover: '#1f1f1f',
}

export const DEFAULT_CUSTOMER_THEME: PanelTheme = {
  background: '#f8fafc',
  foreground: '#111827',
  card: '#ffffff',
  cardForeground: '#111827',
  muted: '#f9fafb',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  accent: '#9333ea',
  accentForeground: '#ffffff',
  hover: '#f3e8ff',
}

export const DEFAULT_CUSTOMER_DARK_THEME: PanelTheme = {
  background: '#000000',
  foreground: '#f5f5f5',
  card: '#0a0a0a',
  cardForeground: '#f5f5f5',
  muted: '#171717',
  mutedForeground: '#a3a3a3',
  border: '#262626',
  accent: '#a855f7',
  accentForeground: '#ffffff',
  hover: '#1f1f1f',
}

export const DEFAULT_PLATFORM_THEMES: PlatformThemes = {
  admin: DEFAULT_ADMIN_THEME,
  adminDark: DEFAULT_ADMIN_DARK_THEME,
  customer: DEFAULT_CUSTOMER_THEME,
  customerDark: DEFAULT_CUSTOMER_DARK_THEME,
}

/** @deprecated */
export const DEFAULT_PLATFORM_THEME = DEFAULT_ADMIN_THEME

export const ADMIN_THEME_PRESETS: Record<string, { label: string; theme: PanelTheme }> = {
  classic: {
    label: 'Beyaz · Siyah · Kırmızı',
    theme: DEFAULT_ADMIN_THEME,
  },
}

export const ADMIN_DARK_THEME_PRESETS: Record<string, { label: string; theme: PanelTheme }> = {
  black: {
    label: 'Siyah · Kırmızı',
    theme: DEFAULT_ADMIN_DARK_THEME,
  },
}

export const CUSTOMER_THEME_PRESETS: Record<string, { label: string; theme: PanelTheme }> = {
  purple: {
    label: 'Mor marka',
    theme: DEFAULT_CUSTOMER_THEME,
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
      hover: '#eff6ff',
    },
  },
  emerald: {
    label: 'Yeşil',
    theme: {
      background: '#f8fafc',
      foreground: '#14532d',
      card: '#ffffff',
      cardForeground: '#14532d',
      muted: '#f0fdf4',
      mutedForeground: '#4b5563',
      border: '#d1fae5',
      accent: '#059669',
      accentForeground: '#ffffff',
      hover: '#ecfdf5',
    },
  },
}

export const CUSTOMER_DARK_THEME_PRESETS: Record<string, { label: string; theme: PanelTheme }> = {
  black: {
    label: 'Siyah · Mor',
    theme: DEFAULT_CUSTOMER_DARK_THEME,
  },
  slate: {
    label: 'Koyu gri',
    theme: {
      background: '#0f172a',
      foreground: '#f1f5f9',
      card: '#1e293b',
      cardForeground: '#f1f5f9',
      muted: '#1e293b',
      mutedForeground: '#94a3b8',
      border: '#334155',
      accent: '#9333ea',
      accentForeground: '#ffffff',
      hover: '#1e293b',
    },
  },
}

/** @deprecated */
export const PLATFORM_THEME_PRESETS = ADMIN_THEME_PRESETS

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

/** Arka plan rengine göre koyu tema mı */
export function isDarkPanelTheme(theme: PanelTheme): boolean {
  const h = expandHex(theme.background).slice(1)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.45
}

/** Tek bir hex rengin koyu olup olmadığı */
export function isDarkHexColor(hex: string): boolean {
  if (!isValidHexColor(hex)) return false
  return isDarkPanelTheme({ ...DEFAULT_ADMIN_THEME, background: expandHex(hex) })
}

export function normalizePanelTheme(
  input: Partial<PanelTheme> | null | undefined,
  fallback: PanelTheme = DEFAULT_ADMIN_THEME,
): PanelTheme {
  const base = { ...fallback }
  if (!input || typeof input !== 'object') return base

  for (const key of Object.keys(base) as Array<keyof PanelTheme>) {
    const value = input[key]
    if (typeof value === 'string' && isValidHexColor(value)) {
      base[key] = expandHex(value)
    }
  }

  if (!input?.hover && !isValidHexColor(base.hover)) {
    const v = panelCssVars(base)
    base.hover = v.accentSoft
  }

  return base
}

/** Eski tek-palet kayıtlarını admin + müşteri olarak okur */
export function normalizePlatformThemes(input: unknown): PlatformThemes {
  if (!input || typeof input !== 'object') return { ...DEFAULT_PLATFORM_THEMES }

  const obj = input as Record<string, unknown>

  if (obj.admin || obj.customer || obj.customerDark || obj.adminDark) {
    const admin = normalizePanelTheme(obj.admin as Partial<PanelTheme>, DEFAULT_ADMIN_THEME)
    const customer = normalizePanelTheme(obj.customer as Partial<PanelTheme>, DEFAULT_CUSTOMER_THEME)

    let adminDark = obj.adminDark
      ? normalizePanelTheme(obj.adminDark as Partial<PanelTheme>, DEFAULT_ADMIN_DARK_THEME)
      : isDarkPanelTheme(admin)
        ? admin
        : DEFAULT_ADMIN_DARK_THEME

    let adminLight = admin
    if (!obj.adminDark && isDarkPanelTheme(admin)) {
      adminLight = DEFAULT_ADMIN_THEME
    }

    return {
      admin: adminLight,
      adminDark,
      customer,
      customerDark: normalizePanelTheme(
        obj.customerDark as Partial<PanelTheme>,
        DEFAULT_CUSTOMER_DARK_THEME,
      ),
    }
  }

  const legacy = normalizePanelTheme(obj as Partial<PanelTheme>, DEFAULT_ADMIN_THEME)
  const legacyIsDark = isDarkPanelTheme(legacy)
  return {
    admin: legacyIsDark ? DEFAULT_ADMIN_THEME : legacy,
    adminDark: legacyIsDark ? legacy : DEFAULT_ADMIN_DARK_THEME,
    customer: { ...legacy },
    customerDark: { ...DEFAULT_CUSTOMER_DARK_THEME },
  }
}

function adminSidebarColors(theme: PanelTheme) {
  if (isDarkPanelTheme(theme)) {
    const white = theme.foreground
    return { fg: white, muted: white, faint: white, groupLabel: white, activeFg: white, activeDesc: white }
  }
  return {
    fg: theme.foreground,
    muted: theme.mutedForeground,
    faint: `color-mix(in srgb, ${theme.mutedForeground} 75%, ${theme.background} 25%)`,
    groupLabel: theme.mutedForeground,
    activeFg: theme.foreground,
    activeDesc: theme.mutedForeground,
  }
}

function customerSidebarColors(theme: PanelTheme) {
  if (isDarkPanelTheme(theme)) {
    const white = theme.foreground
    return { fg: white, active: white, title: white, groupLabel: white }
  }
  return {
    fg: theme.mutedForeground,
    active: theme.foreground,
    title: theme.foreground,
    groupLabel: theme.mutedForeground,
  }
}
function panelCssVars(theme: PanelTheme) {
  const accentHover = `color-mix(in srgb, ${theme.accent} 82%, #000000 18%)`
  const accentSoft = `color-mix(in srgb, ${theme.accent} 12%, ${theme.background} 88%)`
  const sidebarActive = `color-mix(in srgb, ${theme.accent} 10%, ${theme.background} 90%)`
  const primaryLight = `color-mix(in srgb, ${theme.accent} 14%, ${theme.background} 86%)`

  return {
    accentHover,
    accentSoft,
    sidebarActive,
    primaryLight,
    ring: theme.accent,
  }
}

function customerPanelCssBlock(selector: string, theme: PanelTheme): string {
  const v = panelCssVars(theme)
  const sidebar = customerSidebarColors(theme)

  return `
${selector} {
  --background: ${theme.background};
  --foreground: ${theme.foreground};
  --card: ${theme.card};
  --card-foreground: ${theme.cardForeground};
  --popover: ${theme.card};
  --popover-foreground: ${theme.cardForeground};
  --primary: ${theme.accent};
  --primary-foreground: ${theme.accentForeground};
  --primary-hover: ${v.accentHover};
  --primary-active: ${v.accentHover};
  --primary-light: ${v.primaryLight};
  --primary-glow: color-mix(in srgb, ${theme.accent} 22%, transparent);
  --muted: ${theme.muted};
  --muted-foreground: ${theme.mutedForeground};
  --accent: ${theme.muted};
  --accent-foreground: ${theme.foreground};
  --border: ${theme.border};
  --border-strong: color-mix(in srgb, ${theme.border} 70%, ${theme.foreground} 30%);
  --input: ${theme.border};
  --ring: ${v.ring};
  --destructive: ${theme.accent};
  --destructive-foreground: ${theme.accentForeground};
  --sidebar-bg: ${theme.background};
  --sidebar-bg-end: ${theme.muted};
  --sidebar-foreground: ${sidebar.fg};
  --sidebar-foreground-active: ${sidebar.active};
  --sidebar-title: ${sidebar.title};
  --sidebar-active: ${v.sidebarActive};
  --sidebar-active-border: ${theme.accent};
  --sidebar-border: ${theme.border};
  --sidebar-hover: ${theme.hover};
  --sidebar-surface: ${theme.muted};
  --sidebar-group-label: ${sidebar.groupLabel};
  color-scheme: ${isDarkPanelTheme(theme) ? 'dark' : 'light'};
}
`.trim()
}

export function buildCustomerPanelCss(light: PanelTheme, dark: PanelTheme): string {
  return `${customerPanelCssBlock(':root', light)}\n\n${customerPanelCssBlock('.dark', dark)}`
}

export function buildAdminPanelCss(light: PanelTheme, dark: PanelTheme): string {
  const lightBlock = adminPanelCssBlock(
    '.admin-shell-v2, .admin-overlay-host',
    '.admin-shell-v2 .admin-content-root, .admin-overlay-host',
    light,
  )
  const darkBlock = adminPanelCssBlock(
    '.admin-shell-v2[data-admin-theme="dark"], .admin-overlay-host[data-admin-theme="dark"]',
    '.admin-shell-v2[data-admin-theme="dark"] .admin-content-root, .admin-overlay-host[data-admin-theme="dark"]',
    dark,
  )
  return `${lightBlock}\n\n${darkBlock}`
}

function adminPanelCssBlock(shellSelector: string, contentSelector: string, theme: PanelTheme): string {
  const v = panelCssVars(theme)
  const sidebar = adminSidebarColors(theme)
  const colorScheme = isDarkPanelTheme(theme) ? 'dark' : 'light'

  return `
${shellSelector} {
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
  --admin-accent-hover: ${v.accentHover};
  --admin-accent-soft: ${v.accentSoft};
  --admin-accent-fg: ${theme.accentForeground};
  --admin-topbar-bg: ${theme.background};
  --admin-input-bg: ${theme.card};
  --admin-sidebar-bg: ${theme.background};
  --admin-sidebar-bg-end: ${theme.background};
  --admin-sidebar-active: ${v.sidebarActive};
  --admin-sidebar-hover: ${theme.hover};
  --sidebar-fg: ${sidebar.fg};
  --sidebar-fg-muted: ${sidebar.muted};
  --sidebar-fg-faint: ${sidebar.faint};
  --sidebar-group-label: ${sidebar.groupLabel};
  --sidebar-active-fg: ${sidebar.activeFg};
  --sidebar-active-desc: ${sidebar.activeDesc};
  --sidebar-surface: ${theme.muted};
  --sidebar-border: ${theme.border};
  color-scheme: ${colorScheme};
}

${contentSelector} {
  --background: ${theme.background};
  --foreground: ${theme.foreground};
  --card: ${theme.card};
  --card-foreground: ${theme.cardForeground};
  --popover: ${theme.card};
  --popover-foreground: ${theme.cardForeground};
  --muted: ${theme.muted};
  --muted-foreground: ${theme.mutedForeground};
  --accent: ${theme.muted};
  --accent-foreground: ${theme.foreground};
  --border: ${theme.border};
  --border-strong: color-mix(in srgb, ${theme.border} 70%, ${theme.foreground} 30%);
  --input: ${theme.card};
  --ring: ${v.ring};
  --primary-light: ${v.primaryLight};
}
`.trim()
}

export function buildPlatformThemeCss(themes: PlatformThemes): string {
  return `${buildCustomerPanelCss(themes.customer, themes.customerDark)}\n\n${buildAdminPanelCss(themes.admin, themes.adminDark)}`
}

export const PLATFORM_THEME_STYLE_ID = 'platform-theme-vars'

export function applyPlatformThemeToDocument(themes: PlatformThemes) {
  if (typeof document === 'undefined') return
  const css = buildPlatformThemeCss(themes)
  let el = document.getElementById(PLATFORM_THEME_STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = PLATFORM_THEME_STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

export const PLATFORM_THEME_UPDATED_EVENT = 'platform-theme-updated'
