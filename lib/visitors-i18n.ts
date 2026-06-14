import type { SiteLocale } from './regional-config'
import type { VisitorActivity } from './stores/live-visitors-store'

export type VisitorsMessages = {
  monitor: {
    fetchFailed: string
    upgradeTitle: string
    upgradeDesc: string
    upgradeCta: string
    liveVisitors: string
    searchPlaceholder: string
    noActiveVisitors: string
    anonymous: string
    liveLocation: (n: number) => string
    movements: string
    backToList: string
    screenWatchTitle: string
    screenWatchDesc: string
    visitorsOnline: (n: number) => string
    overlayDenied: string
    overlayDeniedPro: string
    screenCaptureFailed: string
    visitorNotLive: string
    socketOffline: string
    socketConnecting: string
    hdDeniedPro: string
    upgradePlanLink: string
    activityPage: (title: string, url: string) => string
    activityClick: (selector: string) => string
    activityScroll: (pct: number) => string
    activityInput: (field: string) => string
    activityTyping: string
    activityOnline: string
    activityOffline: string
  }
  overlay: {
    live: string
    wait: string
    intervention: string
    interventionOn: string
    interventionOff: string
    interventionBanner: string
    visitorInfo: string
    zoomOut: string
    zoomReset: string
    zoomIn: string
    exitFullscreen: string
    fullscreen: string
    disconnecting: string
    disconnect: string
    online: string
    currentPage: string
    recentActivity: string
    liveScreenAlt: string
    connecting: string
    waitingScreenshot: string
    shareDenied: string
    retry: string
    privacyHiddenTitle: string
    privacyHiddenDesc: string
    privacyResume: string
    screenWatchTitle: string
    screenWatchDesc: string
    screenWatchHint: string
    watchScreen: string
    visitorOffline: string
    justNow: string
    durationMin: (mins: number) => string
    durationHour: (hours: number, mins: number) => string
  }
  activity: {
    emptyTitle: string
    emptyHint: string
    liveActivity: string
    pageview: string
    typing: string
    click: string
    focus: string
    scroll: string
    online: string
    offline: string
  }
  header: {
    anonymousVisitor: string
    online: string
  }
  time: {
    now: string
    seconds: (n: number) => string
    minutes: (n: number) => string
    hours: (n: number) => string
    justNow: string
    durationMin: (mins: number) => string
    durationHour: (hours: number, mins: number) => string
  }
  device: {
    unknown: string
    mobile: string
    tablet: string
    desktop: string
  }
  summary: {
    title: string
    subtitle: (total: number, live: number) => string
    viewAll: string
    refresh: string
    loading: string
    empty: string
  }
}

const tr: VisitorsMessages = {
  monitor: {
    fetchFailed: 'Ziyaretçiler alınamadı',
    upgradeTitle: 'Ziyaretçi Takibi',
    upgradeDesc: 'Canlı ziyaretçi listesi ve sayfa takibi başlangıç paketinde veya ziyaretçi takibi eklentisi ile kullanılabilir.',
    upgradeCta: 'Paketi Yükselt',
    liveVisitors: 'Canlı Ziyaretçiler',
    searchPlaceholder: 'İsim, sayfa, site ara...',
    noActiveVisitors: 'Henüz aktif ziyaretçi yok',
    anonymous: 'Anonim',
    liveLocation: (n) => `Anlık Konum (${n})`,
    movements: 'Hareketler',
    backToList: '← Listeye dön',
    screenWatchTitle: 'Ekran İzleme',
    screenWatchDesc: 'Soldan bir ziyaretçi seçin. Canlı ekran görüntüsü, sayfa geçmişi ve hareketleri anlık izleyin.',
    visitorsOnline: (n) => `● ${n} ziyaretçi çevrimiçi`,
    overlayDenied: 'Ekran izleme mevcut paketinizde kullanılamaz.',
    overlayDeniedPro: 'Ekran izleme Profesyonel pakette veya ekran izleme eklentisi ile kullanılabilir.',
    screenCaptureFailed: 'Ekran görüntüsü alınamadı. Ziyaretçinin widget yüklü sayfada çevrimiçi olduğundan emin olun.',
    visitorNotLive: 'Bu ziyaretçi şu an canlı değil — yalnızca yeşil noktalı (çevrimiçi) ziyaretçiler izlenebilir.',
    socketOffline: 'Canlı bağlantı yok — sayfayı yenileyin veya birkaç saniye bekleyin.',
    socketConnecting: 'Canlı bağlantı kuruluyor… Birkaç saniye bekleyip tekrar deneyin.',
    hdDeniedPro: 'HD ekran paylaşımı Profesyonel pakette kullanılabilir.',
    upgradePlanLink: 'Paketi yükselt',
    activityPage: (title, url) => `Sayfa: ${title || url || '—'}`,
    activityClick: (selector) => `Tıklama${selector ? `: ${selector}` : ''}`,
    activityScroll: (pct) => `Kaydırma %${pct}`,
    activityInput: (field) => `Yazıyor: ${field}`,
    activityTyping: 'Yazıyor…',
    activityOnline: 'Çevrimiçi oldu',
    activityOffline: 'Ayrıldı',
  },
  overlay: {
    live: 'CANLI',
    wait: 'BEKLE',
    intervention: 'Müdahale',
    interventionOn: 'Müdahale modunu kapat',
    interventionOff: 'Fare ile müdahale et',
    interventionBanner: 'Müdahale Modu — Fare, klavye ve scroll ile yardım edin',
    visitorInfo: 'Ziyaretçi Bilgisi',
    zoomOut: 'Uzaklaştır',
    zoomReset: 'Sıfırla',
    zoomIn: 'Yakınlaştır',
    exitFullscreen: 'Küçült',
    fullscreen: 'Tam ekran',
    disconnecting: 'Kapatılıyor…',
    disconnect: 'Bağlantıyı Kes',
    online: 'Çevrimiçi',
    currentPage: 'Mevcut Sayfa',
    recentActivity: 'Son Aktiviteler',
    liveScreenAlt: 'Canlı ekran',
    connecting: 'Canlı ekran bağlantısı kuruluyor…',
    waitingScreenshot: 'Ekran görüntüsü bekleniyor',
    shareDenied: 'Ziyaretçi ekran paylaşımını reddetti',
    retry: 'Tekrar Dene',
    privacyHiddenTitle: 'Gizlilik nedeniyle ekran gizlendi',
    privacyHiddenDesc: 'Ziyaretçi hassas bilgi (şifre, kart, CVV vb.) giriyor. Ekran geçici olarak gizlendi.',
    privacyResume: 'Giriş bitince otomatik devam edecek',
    screenWatchTitle: 'Ekran İzleme',
    screenWatchDesc: 'Ziyaretçinin ekranını gerçek zamanlı izleyin.',
    screenWatchHint: 'Kredi kartı ve şifre gizlilik koruması • Fare ile müdahale',
    watchScreen: 'Ekranı İzle',
    visitorOffline: 'Ziyaretçi çevrimdışı',
    justNow: 'az önce',
    durationMin: (mins) => `${mins} dk`,
    durationHour: (hours, mins) => `${hours} sa ${mins} dk`,
  },
  activity: {
    emptyTitle: 'Ziyaretçinin aktiviteleri burada görünecek',
    emptyHint: 'Sayfa geçişleri, tıklamalar ve yazılar gerçek zamanlı aktarılır',
    liveActivity: 'Canlı Aktivite',
    pageview: 'Sayfa görüntülendi',
    typing: 'Yazıyor',
    click: 'Tıkladı',
    focus: 'Form alanına odaklandı',
    scroll: 'Kaydırdı',
    online: 'Siteye girdi',
    offline: 'Siteden çıktı',
  },
  header: {
    anonymousVisitor: 'Anonim Ziyaretçi',
    online: 'ÇEVRİMİÇİ',
  },
  time: {
    now: 'Şimdi',
    seconds: (n) => `${n}s`,
    minutes: (n) => `${n}dk`,
    hours: (n) => `${n}sa`,
    justNow: 'Az önce',
    durationMin: (mins) => `${mins}dk`,
    durationHour: (hours, mins) => `${hours}sa ${mins}dk`,
  },
  device: {
    unknown: 'Bilinmiyor',
    mobile: 'Mobil',
    tablet: 'Tablet',
    desktop: 'Masaüstü',
  },
  summary: {
    title: 'Anlık Ziyaretçi Takibi',
    subtitle: (total, live) => `${total} ziyaretçi · ${live} canlı`,
    viewAll: 'Tümünü gör',
    refresh: 'Yenile',
    loading: 'Ziyaretçiler yükleniyor…',
    empty: 'Şu an aktif ziyaretçi yok',
  },
}

const en: VisitorsMessages = {
  monitor: {
    fetchFailed: 'Could not load visitors',
    upgradeTitle: 'Visitor Tracking',
    upgradeDesc: 'Live visitor list and page tracking are available on Starter or with the visitor tracking add-on.',
    upgradeCta: 'Upgrade Plan',
    liveVisitors: 'Live Visitors',
    searchPlaceholder: 'Search name, page, site…',
    noActiveVisitors: 'No active visitors yet',
    anonymous: 'Anonymous',
    liveLocation: (n) => `Live Location (${n})`,
    movements: 'Activity',
    backToList: '← Back to list',
    screenWatchTitle: 'Screen Monitoring',
    screenWatchDesc: 'Select a visitor on the left to watch their live screen, page history, and activity in real time.',
    visitorsOnline: (n) => `● ${n} visitor${n === 1 ? '' : 's'} online`,
    overlayDenied: 'Screen monitoring is not available on your current plan.',
    overlayDeniedPro: 'Screen monitoring is available on Pro or with the screen monitoring add-on.',
    screenCaptureFailed: 'Could not capture the screen. Make sure the visitor is online on a page with the widget loaded.',
    visitorNotLive: 'This visitor is not live — only online visitors (green dot) can be monitored.',
    socketOffline: 'Live connection unavailable — refresh the page or wait a few seconds.',
    socketConnecting: 'Connecting live channel… Wait a few seconds and try again.',
    hdDeniedPro: 'HD screen sharing is available on Pro.',
    upgradePlanLink: 'Upgrade plan',
    activityPage: (title, url) => `Page: ${title || url || '—'}`,
    activityClick: (selector) => `Click${selector ? `: ${selector}` : ''}`,
    activityScroll: (pct) => `Scroll ${pct}%`,
    activityInput: (field) => `Typing: ${field}`,
    activityTyping: 'Typing…',
    activityOnline: 'Came online',
    activityOffline: 'Left',
  },
  overlay: {
    live: 'LIVE',
    wait: 'WAIT',
    intervention: 'Intervene',
    interventionOn: 'Exit intervention mode',
    interventionOff: 'Intervene with mouse',
    interventionBanner: 'Intervention Mode — Help with mouse, keyboard, and scroll',
    visitorInfo: 'Visitor Info',
    zoomOut: 'Zoom out',
    zoomReset: 'Reset',
    zoomIn: 'Zoom in',
    exitFullscreen: 'Exit fullscreen',
    fullscreen: 'Fullscreen',
    disconnecting: 'Disconnecting…',
    disconnect: 'Disconnect',
    online: 'Online',
    currentPage: 'Current Page',
    recentActivity: 'Recent Activity',
    liveScreenAlt: 'Live screen',
    connecting: 'Connecting live screen…',
    waitingScreenshot: 'Waiting for screenshot',
    shareDenied: 'Visitor declined screen sharing',
    retry: 'Try Again',
    privacyHiddenTitle: 'Screen hidden for privacy',
    privacyHiddenDesc: 'The visitor is entering sensitive info (password, card, CVV, etc.). The screen is temporarily hidden.',
    privacyResume: 'Will resume automatically when input finishes',
    screenWatchTitle: 'Screen Monitoring',
    screenWatchDesc: 'Watch the visitor screen in real time.',
    screenWatchHint: 'Card & password privacy protection • Mouse intervention',
    watchScreen: 'Watch Screen',
    visitorOffline: 'Visitor offline',
    justNow: 'just now',
    durationMin: (mins) => `${mins} min`,
    durationHour: (hours, mins) => `${hours}h ${mins}m`,
  },
  activity: {
    emptyTitle: 'Visitor activity will appear here',
    emptyHint: 'Page views, clicks, and typing are streamed in real time',
    liveActivity: 'Live Activity',
    pageview: 'Viewed page',
    typing: 'Typing',
    click: 'Clicked',
    focus: 'Focused form field',
    scroll: 'Scrolled',
    online: 'Entered site',
    offline: 'Left site',
  },
  header: {
    anonymousVisitor: 'Anonymous Visitor',
    online: 'ONLINE',
  },
  time: {
    now: 'Now',
    seconds: (n) => `${n}s`,
    minutes: (n) => `${n}m`,
    hours: (n) => `${n}h`,
    justNow: 'Just now',
    durationMin: (mins) => `${mins} min`,
    durationHour: (hours, mins) => `${hours}h ${mins}m`,
  },
  device: {
    unknown: 'Unknown',
    mobile: 'Mobile',
    tablet: 'Tablet',
    desktop: 'Desktop',
  },
  summary: {
    title: 'Live Visitor Tracking',
    subtitle: (total, live) => `${total} visitor${total === 1 ? '' : 's'} · ${live} live`,
    viewAll: 'View all',
    refresh: 'Refresh',
    loading: 'Loading visitors…',
    empty: 'No active visitors right now',
  },
}

export function getVisitorsMessages(locale: SiteLocale): VisitorsMessages {
  return locale === 'en' ? en : tr
}

export function formatVisitorActivityLabel(
  a: VisitorActivity,
  m: VisitorsMessages['monitor']
): string {
  switch (a.eventType) {
    case 'pageview':
      return m.activityPage(a.title || '', a.url || '')
    case 'click':
      return m.activityClick(a.selector || '')
    case 'scroll':
      return m.activityScroll(a.scrollPercentage ?? 0)
    case 'input':
      return m.activityInput(a.fieldName || 'field')
    case 'typing':
      return m.activityTyping
    case 'online':
      return m.activityOnline
    case 'offline':
      return m.activityOffline
    default:
      return a.eventType
  }
}

export function visitorsDateLocale(locale: SiteLocale): string {
  return locale === 'en' ? 'en-US' : 'tr-TR'
}
