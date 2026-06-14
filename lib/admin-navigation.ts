export type AdminBadgeKey = 'inbox' | 'visitors'

export interface AdminNavItem {
  href: string
  label: string
  description: string
  icon: string
  badge?: AdminBadgeKey
  keywords?: string[]
  match?: (pathname: string) => boolean
}

export interface AdminNavGroup {
  id: string
  label: string
  items: AdminNavItem[]
}

export interface AdminModuleLink {
  href: string
  label: string
  description?: string
}

export interface AdminModule {
  id: string
  title: string
  description: string
  accent: 'violet' | 'emerald' | 'sky' | 'amber' | 'rose' | 'cyan'
  icon: string
  links: AdminModuleLink[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Genel Bakış',
    items: [
      {
        href: '/admin',
        label: 'Komuta Merkezi',
        description: 'Canlı özet, modüller, KPI',
        icon: 'dashboard',
        keywords: ['ana', 'home', 'dashboard', 'özet'],
      },
      {
        href: '/admin/platform',
        label: 'Platform Merkezi',
        description: 'A-Z analitik, widget sağlığı, KPI',
        icon: 'platform',
        keywords: ['intel', 'analitik', 'kpi', 'istatistik'],
      },
    ],
  },
  {
    id: 'live',
    label: 'Canlı Operasyon',
    items: [
      {
        href: '/admin/inbox',
        label: 'Gelen Kutusu',
        description: 'Widget mesajları, yanıtla',
        icon: 'inbox',
        badge: 'inbox',
        keywords: ['mesaj', 'sohbet', 'inbox', 'chat'],
        match: (p) => p.startsWith('/admin/inbox'),
      },
      {
        href: '/admin/visitors',
        label: 'Ziyaretçi Takibi',
        description: 'Konum, cihaz, ekran izleme',
        icon: 'visitors',
        badge: 'visitors',
        keywords: ['ziyaretçi', 'canlı', 'ekran', 'visitor'],
        match: (p) => p.startsWith('/admin/visitors'),
      },
      {
        href: '/admin/conversations',
        label: 'Tüm Sohbetler',
        description: 'Platform geneli konuşma arşivi',
        icon: 'conversations',
        keywords: ['konuşma', 'arşiv', 'history'],
        match: (p) => p.startsWith('/admin/conversations'),
      },
    ],
  },
  {
    id: 'customers',
    label: 'Müşteriler & Siteler',
    items: [
      {
        href: '/admin/customer-sites',
        label: 'Kullanıcı & Site Bilgileri',
        description: 'Embed, plan, sahip detayı',
        icon: 'customers',
        keywords: ['müşteri', 'embed', 'site bilgi'],
        match: (p) => p.startsWith('/admin/customer-sites'),
      },
      {
        href: '/admin/users',
        label: 'Kullanıcılar',
        description: 'Hesap, rol, ban yönetimi',
        icon: 'users',
        keywords: ['user', 'hesap', 'admin', 'ban'],
        match: (p) => p.startsWith('/admin/users'),
      },
      {
        href: '/admin/websites',
        label: 'Siteler',
        description: 'Tüm kayıtlı web siteleri',
        icon: 'websites',
        keywords: ['website', 'domain', 'plan'],
        match: (p) => p.startsWith('/admin/websites'),
      },
    ],
  },
  {
    id: 'product',
    label: 'Ürün & Pazarlama',
    items: [
      {
        href: '/admin/widget',
        label: 'Sohbet Widget',
        description: 'Platform widget önizleme',
        icon: 'widget',
        keywords: ['widget', 'launcher', 'chat'],
        match: (p) => p.startsWith('/admin/widget'),
      },
      {
        href: '/admin/marketing',
        label: 'Pazarlama',
        description: 'Landing, kampanya, içerik',
        icon: 'marketing',
        keywords: ['marketing', 'landing', 'blog'],
        match: (p) => p.startsWith('/admin/marketing'),
      },
    ],
  },
  {
    id: 'security',
    label: 'Güvenlik',
    items: [
      {
        href: '/admin/ip-bans',
        label: 'IP Engelleme',
        description: 'Kötüye kullanım engeli',
        icon: 'ipbans',
        keywords: ['ip', 'ban', 'engel', 'güvenlik'],
        match: (p) => p.startsWith('/admin/ip-bans'),
      },
      {
        href: '/admin/settings',
        label: 'Platform Ayarları',
        description: 'Sistem, API, entegrasyonlar',
        icon: 'settings',
        keywords: ['ayar', 'config', 'platform'],
        match: (p) => p.startsWith('/admin/settings'),
      },
    ],
  },
]

export const ADMIN_MODULES: AdminModule[] = [
  {
    id: 'live',
    title: 'Canlı Operasyon',
    description: 'Anlık mesaj, ziyaretçi ve sohbet yönetimi',
    accent: 'emerald',
    icon: 'activity',
    links: [
      { href: '/admin/inbox', label: 'Gelen Kutusu', description: 'Okunmamış widget mesajları' },
      { href: '/admin/visitors', label: 'Ziyaretçi Takibi', description: 'Konum, tarayıcı, ekran' },
      { href: '/admin/conversations', label: 'Tüm Sohbetler', description: 'Arşiv ve filtreleme' },
    ],
  },
  {
    id: 'customers',
    title: 'Müşteriler & Siteler',
    description: 'Kullanıcı hesapları, siteler ve embed kodları',
    accent: 'sky',
    icon: 'users',
    links: [
      { href: '/admin/customer-sites', label: 'Kullanıcı & Site Bilgileri', description: 'Detaylı müşteri profili' },
      { href: '/admin/users', label: 'Kullanıcı Yönetimi', description: 'Rol, ban, hesap' },
      { href: '/admin/websites', label: 'Site Listesi', description: 'Plan ve domain' },
    ],
  },
  {
    id: 'intel',
    title: 'Platform İstihbaratı',
    description: 'Büyüme, deneme hunisi ve gelir metrikleri',
    accent: 'violet',
    icon: 'chart',
    links: [
      { href: '/admin/platform', label: 'Platform Merkezi', description: 'A-Z KPI paneli' },
      { href: '/admin', label: 'Deneme Hunisi', description: 'Komuta merkezinde' },
      { href: '/admin/websites', label: 'Plan Dağılımı', description: 'Ücretli / deneme / free' },
    ],
  },
  {
    id: 'product',
    title: 'Ürün & Widget',
    description: 'Widget, pazarlama ve müşteri deneyimi',
    accent: 'cyan',
    icon: 'widget',
    links: [
      { href: '/admin/widget', label: 'Widget Önizleme', description: 'Platform chat widget' },
      { href: '/admin/marketing', label: 'Pazarlama', description: 'Site içeriği ve kampanya' },
      { href: '/dashboard', label: 'Müşteri Paneli', description: 'Müşteri görünümüne geç' },
    ],
  },
  {
    id: 'security',
    title: 'Güvenlik & Ayarlar',
    description: 'IP engeli, platform yapılandırması',
    accent: 'amber',
    icon: 'shield',
    links: [
      { href: '/admin/ip-bans', label: 'IP Engelleme', description: 'Kara liste yönetimi' },
      { href: '/admin/settings', label: 'Platform Ayarları', description: 'Sistem konfigürasyonu' },
      { href: '/api/health', label: 'Sistem Sağlığı', description: 'API durumu (JSON)' },
    ],
  },
]

export function getAdminNavFlat(): AdminNavItem[] {
  return ADMIN_NAV_GROUPS.flatMap((g) => g.items)
}

export function isAdminNavActive(item: AdminNavItem, pathname: string): boolean {
  if (item.match) return item.match(pathname)
  if (item.href === '/admin') return pathname === '/admin'
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function getAdminPageTitle(pathname: string): string | null {
  for (const item of getAdminNavFlat()) {
    if (isAdminNavActive(item, pathname)) return item.label
  }
  return null
}
