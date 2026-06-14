import type { SiteLocale } from './regional-config'

export type DashboardNavItem = { href: string; icon: string; label: string; badge: string | null }
export type DashboardNavGroup = { title: string; items: DashboardNavItem[] }

export type DashboardMessages = {
  nav: {
    home: string
    monitoring: string
    communication: string
    content: string
    marketing: string
    configuration: string
    addons: string
    subscription: string
    account: string
    management: string
    adminPanel: string
    overview: string
    inbox: string
    contacts: string
    analytics: string
    visitors: string
    visitorsScreen: string
    widget: string
    channels: string
    knowledge: string
    tickets: string
    chatbot: string
    cannedResponses: string
    csat: string
    workflows: string
    campaigns: string
    generalSettings: string
    team: string
    webhooks: string
    proactive: string
    statusPage: string
    addonStore: string
    plans: string
    billing: string
    privacy: string
  }
  pageTitles: {
    dashboard: string
    inbox: string
    contacts: string
    visitors: string
    analytics: string
    plans: string
    general: string
    billing: string
    addons: string
    settings: string
  }
  shell: {
    user: string
    noDomain: string
    lightTheme: string
    darkTheme: string
    signOut: string
    backToSite: string
    menu: string
    selectWebsite: string
    switchAccount: string
    mainMenu: string
    back: string
  }
  nativeNav: {
    inbox: string
    panel: string
    contacts: string
    settings: string
  }
  dashboard: {
    controlCenter: string
    welcome: string
    welcomeWithName: (name: string) => string
    subtitleWithSite: (name: string) => string
    subtitleDefault: string
    channels: string
    inbox: string
    openChats: string
    todayChats: string
    activeVisitors: string
    avgFirstResponse: string
    liveMonitoring: string
    channelDistribution: string
    thisMonth: string
    loading: string
    noChatsYet: string
    connectChannels: string
    agentPerformance: string
    noAgentActivity: string
    agent: string
    messages: string
    resolved: string
    widgetSetup: string
    embedCodeFor: (name: string) => string
    copied: string
    copy: string
    aiAgent: string
    aiAgentSubtitle: string
    aiResolutionRate: (rate: number, replies: number) => string
    aiActiveAuto: string
    aiActiveManual: string
    aiOff: string
    aiSettings: string
    performance: string
    totalChatsMonth: string
    resolutionRate: string
    plan: string
    upgrade: string
    freePlan: string
    chatUsageMonth: string
    unlimited: string
    quickAccess: string
    quickWidget: string
    quickTeam: string
    quickChatbot: string
  }
  common: {
    save: string
    cancel: string
    retry: string
    delete: string
    loading: string
    anonymous: string
    file: string
    today: string
    yesterday: string
    now: string
    minutesAgo: (n: number) => string
    hoursAgo: (n: number) => string
    daysAgo: (n: number) => string
    timeMin: (n: number) => string
    timeHour: (n: number) => string
    timeDay: (n: number) => string
  }
  inbox: {
    title: string
    soundOn: string
    soundOff: string
    activeSite: string
    allSites: string
    filterAll: string
    filterMe: string
    filterUnassigned: string
    statusOpen: string
    statusPending: string
    statusResolved: string
    statusClosed: string
    searchPlaceholder: string
    siteLoading: string
    noChats: string
    noChatsHint: string
    selectChat: string
    selectChatHint: string
    noMessages: string
    negativeSentiment: string
    loadingInbox: string
    updateFailed: string
    uploadFailed: string
    sendFailed: string
    aiSuggestFailed: string
    assignToMe: string
    markResolved: string
    reopen: string
    translate: string
    translateOff: string
    translatePro: string
    profile: string
    live: string
    connecting: string
    sync: string
    writeMessage: string
    writeMessageCanned: string
    writeTranslate: (from: string, to: string) => string
    send: string
    addFile: string
    aiSuggest: string
    sendHint: string
    yourLanguage: string
    liveTranslateActive: (lang: string) => string
    detectingVisitorLang: string
    visitor: string
    close: string
    contactSection: string
    locationSection: string
    historySection: string
    email: string
    phone: string
    location: string
    noContactInfo: string
    currentPage: string
    landingPage: string
    referrer: string
    device: string
    pastChats: string
    openCrm: string
    download: string
    translateMessage: string
    originalLabel: string
    showOriginal: string
    watchScreenLive: string
    agentLabel: string
    pageSection: string
    sourceLabel: string
    assignedSection: string
    langPairHint: (incoming: string, outgoing: string) => string
    editContactHint: string
    nameLabel: string
    contactSaved: string
  }
  growth: {
    title: string
    subtitle: string
    comingSoon: string
    items: Array<{ title: string; desc: string; badge: string | null }>
  }
  notifications: {
    title: string
    markAllRead: string
    empty: string
    justNow: string
    minutesAgo: (n: number) => string
    hoursAgo: (n: number) => string
    daysAgo: (n: number) => string
  }
  contacts: {
    title: string
    subtitle: string
    searchPlaceholder: string
    noContacts: string
    noContactsHint: string
    conversations: string
    viewProfile: string
    person: string
    location: string
    device: string
    chat: string
    lastActivity: string
    notFound: string
    backToContacts: string
    locationUnknown: string
    noChatsYet: string
    defaultChatPreview: string
  }
  analytics: {
    title: string
    performanceMetrics: string
    exportProOnly: string
    exportConversations: string
    exportVisitors: string
    exportTeam: string
    period7d: string
    period30d: string
    period90d: string
    totalChats: string
    openChats: string
    resolutionRate: string
    visitors: string
    dailyChatTraffic: string
    topPages: string
    teamPerformance: string
    noData: string
    colAgent: string
    colRole: string
    colAssigned: string
    colResolved: string
    colMessages: string
    colResolutionPct: string
    roleOwner: string
    roleAdmin: string
    roleAgent: string
    noTeamMembers: string
    csvDownloaded: string
    exportFailed: string
  }
}

const tr: DashboardMessages = {
  nav: {
    home: 'Ana Sayfa',
    monitoring: 'İzleme & Analiz',
    communication: 'İletişim',
    content: 'İçerik & Otomasyon',
    marketing: 'Pazarlama',
    configuration: 'Yapılandırma',
    addons: 'Eklentiler',
    subscription: 'Abonelik',
    account: 'Hesap',
    management: 'Yönetim',
    adminPanel: 'Admin Paneli',
    overview: 'Genel Bakış',
    inbox: 'Gelen Kutusu',
    contacts: 'Kişiler',
    analytics: 'Analitik',
    visitors: 'Ziyaretçiler',
    visitorsScreen: 'Ekran İzleme',
    widget: "Sohbet Widget'ı",
    channels: 'Kanallar',
    knowledge: 'Bilgi Bankası',
    tickets: 'Bilet Sistemi',
    chatbot: 'Chatbot',
    cannedResponses: 'Hazır Cevaplar',
    csat: 'CSAT Puanları',
    workflows: 'Otomasyonlar',
    campaigns: 'Kampanyalar',
    generalSettings: 'Genel Ayarlar',
    team: 'Takım',
    webhooks: "Webhook'lar",
    proactive: 'Hedefli Mesajlar',
    statusPage: 'Durum Sayfası',
    addonStore: 'Eklenti Mağazası',
    plans: 'Paketler',
    billing: 'Faturalama',
    privacy: 'Gizlilik & KVKK',
  },
  pageTitles: {
    dashboard: 'Genel Bakış',
    inbox: 'Gelen Kutusu',
    contacts: 'Kişiler',
    visitors: 'Ekran İzleme',
    analytics: 'Analitik',
    plans: 'Paketler',
    general: 'Website Bilgileri',
    billing: 'Faturalama',
    addons: 'Eklenti Mağazası',
    settings: 'Ayarlar',
  },
  shell: {
    user: 'Kullanıcı',
    noDomain: 'domain yok',
    lightTheme: 'Açık Tema',
    darkTheme: 'Koyu Tema',
    signOut: 'Çıkış Yap',
    backToSite: 'Siteye Dön',
    menu: 'Menü',
    selectWebsite: 'Website Seç',
    switchAccount: 'Hesap Değiştir',
    mainMenu: 'Ana menü',
    back: 'Geri',
  },
  nativeNav: {
    inbox: 'Inbox',
    panel: 'Panel',
    contacts: 'Kişiler',
    settings: 'Ayarlar',
  },
  dashboard: {
    controlCenter: 'Gu Live Chat · Kontrol Merkezi',
    welcome: 'Hoş geldiniz',
    welcomeWithName: (name) => `Hoş geldiniz, ${name}`,
    subtitleWithSite: (name) => `${name} için tüm kanallar, AI asistan ve analitik tek panelde.`,
    subtitleDefault: 'Canlı destek operasyonunuzu buradan yönetin.',
    channels: 'Kanallar',
    inbox: 'Gelen Kutusu',
    openChats: 'Açık Sohbetler',
    todayChats: 'Bugünkü Sohbetler',
    activeVisitors: 'Aktif Ziyaretçiler',
    avgFirstResponse: 'Ort. İlk Yanıt',
    liveMonitoring: 'Canlı izleme',
    channelDistribution: 'Kanal dağılımı',
    thisMonth: 'Bu ay',
    loading: 'Yükleniyor…',
    noChatsYet: 'Henüz sohbet yok. Widget veya kanal entegrasyonu ile başlayın.',
    connectChannels: 'WhatsApp, Instagram, Telegram bağla',
    agentPerformance: 'Temsilci performansı',
    noAgentActivity: 'Bu ay henüz temsilci aktivitesi yok.',
    agent: 'Temsilci',
    messages: 'Mesaj',
    resolved: 'Çözülen',
    widgetSetup: 'Widget Kurulumu',
    embedCodeFor: (name) => `${name} için embed kodu`,
    copied: 'Kopyalandı',
    copy: 'Kopyala',
    aiAgent: 'AI Agent',
    aiAgentSubtitle: 'Standart talepleri anında işleyin',
    aiResolutionRate: (rate, replies) => `AI destekli çözüm oranı (bu ay) · ${replies} bot yanıtı`,
    aiActiveAuto: 'Aktif — ziyaretçilere otomatik yanıt veriyor',
    aiActiveManual: 'Açık — otomatik yanıt kapalı',
    aiOff: 'Kapalı',
    aiSettings: 'AI Agent ayarları',
    performance: 'Performans',
    totalChatsMonth: 'Toplam sohbet (ay)',
    resolutionRate: 'Çözüm oranı',
    plan: 'Plan',
    upgrade: 'Yükselt →',
    freePlan: 'Ücretsiz',
    chatUsageMonth: 'Sohbet kullanımı (bu ay)',
    unlimited: 'Sınırsız',
    quickAccess: 'Hızlı erişim',
    quickWidget: 'Widget',
    quickTeam: 'Takım',
    quickChatbot: 'Chatbot & AI',
  },
  common: {
    save: 'Kaydet',
    cancel: 'İptal',
    retry: 'Tekrar dene',
    delete: 'Sil',
    loading: 'Yükleniyor…',
    anonymous: 'Anonim',
    file: 'dosya',
    today: 'Bugün',
    yesterday: 'Dün',
    now: 'şimdi',
    minutesAgo: (n) => `${n} dk önce`,
    hoursAgo: (n) => `${n} saat önce`,
    daysAgo: (n) => `${n} gün önce`,
    timeMin: (n) => `${n} dk`,
    timeHour: (n) => `${n} sa`,
    timeDay: (n) => `${n} g`,
  },
  inbox: {
    title: 'Gelen Kutusu',
    soundOn: 'Bildirim sesi açık',
    soundOff: 'Bildirim sesi kapalı',
    activeSite: 'Aktif',
    allSites: 'Tüm siteler',
    filterAll: 'Tümü',
    filterMe: 'Bana',
    filterUnassigned: 'Atanmamış',
    statusOpen: 'Açık',
    statusPending: 'Bekleyen',
    statusResolved: 'Çözülen',
    statusClosed: 'Kapalı',
    searchPlaceholder: 'Sohbet ara…',
    siteLoading: 'Site yükleniyor…',
    noChats: 'Henüz sohbet yok',
    noChatsHint: "Widget'tan gelen mesajlar burada görünür.",
    selectChat: 'Sohbet seçin',
    selectChatHint: 'Detayları görmek için listeden bir sohbet açın',
    noMessages: 'Henüz mesaj yok',
    negativeSentiment: 'Ziyaretçi olumsuz ton — öncelik verin',
    loadingInbox: 'Gelen kutusu yükleniyor…',
    updateFailed: 'Güncellenemedi',
    uploadFailed: 'Dosya yüklenemedi',
    sendFailed: 'Mesaj gönderilemedi',
    aiSuggestFailed: 'AI önerisi alınamadı',
    assignToMe: 'Bana ata',
    markResolved: 'Çözüldü',
    reopen: 'Yeniden aç',
    translate: 'Çeviri',
    translateOff: 'Çeviriyi kapat',
    translatePro: 'Otomatik çeviri aç',
    profile: 'Profil',
    live: 'Canlı',
    connecting: 'Bağlanıyor',
    sync: 'Senkron',
    writeMessage: 'Mesaj yazın…',
    writeMessageCanned: 'Mesaj yazın… (/ hazır cevap)',
    writeTranslate: (from, to) => `${from} yazın — ${to}'ye çevrilir`,
    send: 'Gönder',
    addFile: 'Dosya ekle',
    aiSuggest: 'AI öneri',
    sendHint: 'Enter gönder · Shift+Enter yeni satır',
    yourLanguage: 'Diliniz:',
    liveTranslateActive: (lang) => `↔ ${lang} canlı çeviri aktif`,
    detectingVisitorLang: 'Ziyaretçi dili algılanıyor…',
    visitor: 'Ziyaretçi',
    close: 'Kapat',
    contactSection: 'İletişim',
    locationSection: 'Konum & cihaz',
    historySection: 'Geçmiş sohbetler',
    email: 'E-posta',
    phone: 'Telefon',
    location: 'Konum',
    noContactInfo: 'İletişim bilgisi yok',
    currentPage: 'Şu an',
    landingPage: 'Giriş',
    referrer: 'Referrer',
    device: 'Cihaz',
    pastChats: 'Geçmiş sohbetler',
    openCrm: 'CRM profilini aç',
    download: 'İndir',
    translateMessage: 'Çevir',
    originalLabel: 'Orijinal',
    showOriginal: 'Orijinali göster',
    watchScreenLive: 'Canlı ekran izle',
    agentLabel: 'Temsilci',
    pageSection: 'Sayfa',
    sourceLabel: 'Kaynak',
    assignedSection: 'Atanan',
    langPairHint: (incoming, outgoing) => `Gelen mesajlar ${incoming} · Yanıtlarınız ${outgoing}`,
    editContactHint: 'İsteğe bağlı — ziyaretçi adı ve e-postasını siz girebilirsiniz',
    nameLabel: 'İsim',
    contactSaved: 'Kaydedildi',
  },
  growth: {
    title: 'İşletmeniz için fırsatlar',
    subtitle: 'Satış ve desteği artıran ek özellikler',
    comingSoon: 'Yakında',
    items: [
      {
        title: 'WhatsApp & Sosyal',
        desc: "WhatsApp, Instagram, Telegram ve Messenger'ı tek gelen kutusuna bağlayın.",
        badge: 'PRO',
      },
      {
        title: 'Gu Pazarlama',
        desc: 'Trafiği hedefli potansiyel müşterilere dönüştürün, kampanyalar gönderin.',
        badge: 'PRO',
      },
      {
        title: 'AI Agent',
        desc: 'Standart talepleri otomatik yanıtlayın, ekibinize zaman kazandırın.',
        badge: 'PRO',
      },
      {
        title: 'YZ Yazım Yardımcısı',
        desc: 'Gelen kutusunda AI öneri ile daha hızlı ve etkili yanıtlar yazın.',
        badge: null,
      },
      {
        title: 'Video & Ekran',
        desc: 'Ziyaretçi ekranını canlı izleyin, görüntülü destek sunun.',
        badge: 'PRO',
      },
      {
        title: 'Telefon & SMS',
        desc: 'Twilio SMS entegrasyonu ile sesli ve yazılı kanalları birleştirin.',
        badge: 'Yakında',
      },
    ],
  },
  notifications: {
    title: 'Bildirimler',
    markAllRead: 'Tümünü okundu işaretle',
    empty: 'Henüz bildiriminiz yok',
    justNow: 'Az önce',
    minutesAgo: (n) => `${n} dk önce`,
    hoursAgo: (n) => `${n} saat önce`,
    daysAgo: (n) => `${n} gün önce`,
  },
  contacts: {
    title: 'Kişiler',
    subtitle: 'Ziyaretçilerin profil bilgilerini ve sohbet geçmişini yönetin',
    searchPlaceholder: 'İsim veya e-posta ara…',
    noContacts: 'Henüz kişi yok',
    noContactsHint: 'İlk ziyaretçi sohbet başlattığında kişiler burada görünecek',
    conversations: 'sohbet',
    viewProfile: 'Profili gör',
    person: 'Kişi',
    location: 'Konum',
    device: 'Cihaz',
    chat: 'Sohbet',
    lastActivity: 'Son Aktivite',
    notFound: 'Kişi bulunamadı',
    backToContacts: '← Kişilere dön',
    locationUnknown: 'Konum bilinmiyor',
    noChatsYet: 'Henüz sohbet yok',
    defaultChatPreview: 'Sohbet',
  },
  analytics: {
    title: 'Analitik',
    performanceMetrics: 'Performans metrikleri',
    exportProOnly: 'CSV dışa aktarma Profesyonel pakette',
    exportConversations: 'Sohbetler',
    exportVisitors: 'Ziyaretçiler',
    exportTeam: 'Ekip',
    period7d: 'Son 7 Gün',
    period30d: 'Son 30 Gün',
    period90d: 'Son 90 Gün',
    totalChats: 'Toplam Sohbet',
    openChats: 'Açık Sohbetler',
    resolutionRate: 'Çözülme Oranı',
    visitors: 'Ziyaretçiler',
    dailyChatTraffic: 'Günlük Sohbet Trafiği',
    topPages: 'En Çok Ziyaret Edilen Sayfalar',
    teamPerformance: 'Takım Performansı',
    noData: 'Henüz veri yok',
    colAgent: 'Temsilci',
    colRole: 'Rol',
    colAssigned: 'Atanan',
    colResolved: 'Çözülen',
    colMessages: 'Mesajlar',
    colResolutionPct: 'Çözülme %',
    roleOwner: 'Sahip',
    roleAdmin: 'Yönetici',
    roleAgent: 'Temsilci',
    noTeamMembers: 'Henüz takım üyesi yok',
    csvDownloaded: 'CSV indirildi',
    exportFailed: 'Dışa aktarma başarısız',
  },
}

const en: DashboardMessages = {
  nav: {
    home: 'Home',
    monitoring: 'Monitoring & Analytics',
    communication: 'Communication',
    content: 'Content & Automation',
    marketing: 'Marketing',
    configuration: 'Configuration',
    addons: 'Add-ons',
    subscription: 'Subscription',
    account: 'Account',
    management: 'Management',
    adminPanel: 'Admin Panel',
    overview: 'Overview',
    inbox: 'Inbox',
    contacts: 'Contacts',
    analytics: 'Analytics',
    visitors: 'Visitors',
    visitorsScreen: 'Screen Monitoring',
    widget: 'Chat Widget',
    channels: 'Channels',
    knowledge: 'Knowledge Base',
    tickets: 'Ticketing',
    chatbot: 'Chatbot',
    cannedResponses: 'Canned Responses',
    csat: 'CSAT Scores',
    workflows: 'Automations',
    campaigns: 'Campaigns',
    generalSettings: 'General Settings',
    team: 'Team',
    webhooks: 'Webhooks',
    proactive: 'Proactive Messages',
    statusPage: 'Status Page',
    addonStore: 'Add-on Store',
    plans: 'Plans',
    billing: 'Billing',
    privacy: 'Privacy & GDPR',
  },
  pageTitles: {
    dashboard: 'Overview',
    inbox: 'Inbox',
    contacts: 'Contacts',
    visitors: 'Screen Monitoring',
    analytics: 'Analytics',
    plans: 'Plans',
    general: 'Website Details',
    billing: 'Billing',
    addons: 'Add-on Store',
    settings: 'Settings',
  },
  shell: {
    user: 'User',
    noDomain: 'no domain',
    lightTheme: 'Light theme',
    darkTheme: 'Dark theme',
    signOut: 'Sign out',
    backToSite: 'Back to site',
    menu: 'Menu',
    selectWebsite: 'Select website',
    switchAccount: 'Switch account',
    mainMenu: 'Main menu',
    back: 'Back',
  },
  nativeNav: {
    inbox: 'Inbox',
    panel: 'Dashboard',
    contacts: 'Contacts',
    settings: 'Settings',
  },
  dashboard: {
    controlCenter: 'Gu Live Chat · Control Center',
    welcome: 'Welcome',
    welcomeWithName: (name) => `Welcome, ${name}`,
    subtitleWithSite: (name) => `All channels, AI assistant, and analytics for ${name} in one place.`,
    subtitleDefault: 'Manage your live support operations from here.',
    channels: 'Channels',
    inbox: 'Inbox',
    openChats: 'Open chats',
    todayChats: "Today's chats",
    activeVisitors: 'Active visitors',
    avgFirstResponse: 'Avg. first response',
    liveMonitoring: 'Live monitoring',
    channelDistribution: 'Channel breakdown',
    thisMonth: 'This month',
    loading: 'Loading…',
    noChatsYet: 'No chats yet. Get started with the widget or channel integrations.',
    connectChannels: 'Connect WhatsApp, Instagram, Telegram',
    agentPerformance: 'Agent performance',
    noAgentActivity: 'No agent activity this month yet.',
    agent: 'Agent',
    messages: 'Messages',
    resolved: 'Resolved',
    widgetSetup: 'Widget setup',
    embedCodeFor: (name) => `Embed code for ${name}`,
    copied: 'Copied',
    copy: 'Copy',
    aiAgent: 'AI Agent',
    aiAgentSubtitle: 'Handle standard requests instantly',
    aiResolutionRate: (rate, replies) => `AI-assisted resolution rate (this month) · ${replies} bot replies`,
    aiActiveAuto: 'Active — auto-replying to visitors',
    aiActiveManual: 'On — auto-reply disabled',
    aiOff: 'Off',
    aiSettings: 'AI Agent settings',
    performance: 'Performance',
    totalChatsMonth: 'Total chats (month)',
    resolutionRate: 'Resolution rate',
    plan: 'Plan',
    upgrade: 'Upgrade →',
    freePlan: 'Free',
    chatUsageMonth: 'Chat usage (this month)',
    unlimited: 'Unlimited',
    quickAccess: 'Quick access',
    quickWidget: 'Widget',
    quickTeam: 'Team',
    quickChatbot: 'Chatbot & AI',
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    retry: 'Try again',
    delete: 'Delete',
    loading: 'Loading…',
    anonymous: 'Anonymous',
    file: 'file',
    today: 'Today',
    yesterday: 'Yesterday',
    now: 'now',
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
    timeMin: (n) => `${n}m`,
    timeHour: (n) => `${n}h`,
    timeDay: (n) => `${n}d`,
  },
  inbox: {
    title: 'Inbox',
    soundOn: 'Notification sound on',
    soundOff: 'Notification sound off',
    activeSite: 'Active',
    allSites: 'All sites',
    filterAll: 'All',
    filterMe: 'Mine',
    filterUnassigned: 'Unassigned',
    statusOpen: 'Open',
    statusPending: 'Pending',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',
    searchPlaceholder: 'Search conversations…',
    siteLoading: 'Loading site…',
    noChats: 'No conversations yet',
    noChatsHint: 'Messages from the widget will appear here.',
    selectChat: 'Select a conversation',
    selectChatHint: 'Open a conversation from the list to see details',
    noMessages: 'No messages yet',
    negativeSentiment: 'Visitor tone is negative — prioritize this chat',
    loadingInbox: 'Loading inbox…',
    updateFailed: 'Could not update',
    uploadFailed: 'File upload failed',
    sendFailed: 'Could not send message',
    aiSuggestFailed: 'Could not get AI suggestion',
    assignToMe: 'Assign to me',
    markResolved: 'Resolved',
    reopen: 'Reopen',
    translate: 'Translate',
    translateOff: 'Turn off translation',
    translatePro: 'Turn on auto-translate',
    profile: 'Profile',
    live: 'Live',
    connecting: 'Connecting',
    sync: 'Sync',
    writeMessage: 'Write a message…',
    writeMessageCanned: 'Write a message… (/ for canned replies)',
    writeTranslate: (from, to) => `Write in ${from} — translated to ${to}`,
    send: 'Send',
    addFile: 'Attach file',
    aiSuggest: 'AI suggest',
    sendHint: 'Enter to send · Shift+Enter for new line',
    yourLanguage: 'Your language:',
    liveTranslateActive: (lang) => `↔ Live translation with ${lang}`,
    detectingVisitorLang: 'Detecting visitor language…',
    visitor: 'Visitor',
    close: 'Close',
    contactSection: 'Contact',
    locationSection: 'Location & device',
    historySection: 'Past conversations',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    noContactInfo: 'No contact info',
    currentPage: 'Current page',
    landingPage: 'Landing page',
    referrer: 'Referrer',
    device: 'Device',
    pastChats: 'Past conversations',
    openCrm: 'Open CRM profile',
    download: 'Download',
    translateMessage: 'Translate',
    originalLabel: 'Original',
    showOriginal: 'Show original',
    watchScreenLive: 'Watch live screen',
    agentLabel: 'Agent',
    pageSection: 'Page',
    sourceLabel: 'Source',
    assignedSection: 'Assigned',
    langPairHint: (incoming, outgoing) => `Incoming in ${incoming} · Your replies in ${outgoing}`,
    editContactHint: 'Optional — you can set the visitor name and email',
    nameLabel: 'Name',
    contactSaved: 'Saved',
  },
  growth: {
    title: 'Growth opportunities',
    subtitle: 'Add-ons that boost sales and support',
    comingSoon: 'Coming soon',
    items: [
      {
        title: 'WhatsApp & Social',
        desc: 'Connect WhatsApp, Instagram, Telegram, and Messenger to one inbox.',
        badge: 'PRO',
      },
      {
        title: 'Gu Marketing',
        desc: 'Turn traffic into qualified leads and send targeted campaigns.',
        badge: 'PRO',
      },
      {
        title: 'AI Agent',
        desc: 'Auto-answer standard requests and save your team time.',
        badge: 'PRO',
      },
      {
        title: 'AI Writing Assistant',
        desc: 'Reply faster with AI suggestions directly in the inbox.',
        badge: null,
      },
      {
        title: 'Video & Screen',
        desc: 'Watch visitor screens live and offer video support.',
        badge: 'PRO',
      },
      {
        title: 'Phone & SMS',
        desc: 'Unify voice and text channels with Twilio SMS integration.',
        badge: 'Coming soon',
      },
    ],
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    empty: 'No notifications yet',
    justNow: 'Just now',
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
  },
  contacts: {
    title: 'Contacts',
    subtitle: 'Manage visitor profiles and conversation history',
    searchPlaceholder: 'Search name or email…',
    noContacts: 'No contacts yet',
    noContactsHint: 'Contacts appear here when visitors start their first chat',
    conversations: 'chats',
    viewProfile: 'View profile',
    person: 'Contact',
    location: 'Location',
    device: 'Device',
    chat: 'Chats',
    lastActivity: 'Last activity',
    notFound: 'Contact not found',
    backToContacts: '← Back to contacts',
    locationUnknown: 'Location unknown',
    noChatsYet: 'No chats yet',
    defaultChatPreview: 'Chat',
  },
  analytics: {
    title: 'Analytics',
    performanceMetrics: 'Performance metrics',
    exportProOnly: 'CSV export is available on Pro',
    exportConversations: 'Conversations',
    exportVisitors: 'Visitors',
    exportTeam: 'Team',
    period7d: 'Last 7 days',
    period30d: 'Last 30 days',
    period90d: 'Last 90 days',
    totalChats: 'Total Chats',
    openChats: 'Open Chats',
    resolutionRate: 'Resolution Rate',
    visitors: 'Visitors',
    dailyChatTraffic: 'Daily Chat Traffic',
    topPages: 'Top Visited Pages',
    teamPerformance: 'Team Performance',
    noData: 'No data yet',
    colAgent: 'Agent',
    colRole: 'Role',
    colAssigned: 'Assigned',
    colResolved: 'Resolved',
    colMessages: 'Messages',
    colResolutionPct: 'Resolution %',
    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleAgent: 'Agent',
    noTeamMembers: 'No team members yet',
    csvDownloaded: 'CSV downloaded',
    exportFailed: 'Export failed',
  },
}

export function getDashboardMessages(locale: SiteLocale): DashboardMessages {
  return locale === 'en' ? en : tr
}

export function getDashboardNavGroups(d: DashboardMessages): DashboardNavGroup[] {
  const { nav: n } = d
  return [
    {
      title: n.home,
      items: [
        { href: '/dashboard', icon: 'home', label: n.overview, badge: null },
        { href: '/inbox', icon: 'inbox', label: n.inbox, badge: null },
        { href: '/contacts', icon: 'contacts', label: n.contacts, badge: null },
      ],
    },
    {
      title: n.monitoring,
      items: [
        { href: '/analytics', icon: 'analytics', label: n.analytics, badge: null },
        { href: '/visitors', icon: 'visitors', label: n.visitorsScreen, badge: null },
      ],
    },
    {
      title: n.communication,
      items: [
        { href: '/settings/widget', icon: 'widget', label: n.widget, badge: null },
        { href: '/settings/channels', icon: 'channels', label: n.channels, badge: null },
      ],
    },
    {
      title: n.content,
      items: [
        { href: '/settings/knowledge', icon: 'book', label: n.knowledge, badge: null },
        { href: '/settings/tickets', icon: 'ticket', label: n.tickets, badge: null },
        { href: '/settings/chatbot', icon: 'bot', label: n.chatbot, badge: null },
        { href: '/settings/canned-responses', icon: 'message', label: n.cannedResponses, badge: null },
        { href: '/settings/ratings', icon: 'star', label: n.csat, badge: null },
        { href: '/settings/workflows', icon: 'workflow', label: n.workflows, badge: null },
      ],
    },
    {
      title: n.marketing,
      items: [{ href: '/settings/campaigns', icon: 'campaign', label: n.campaigns, badge: null }],
    },
    {
      title: n.configuration,
      items: [
        { href: '/settings', icon: 'settings', label: n.generalSettings, badge: null },
        { href: '/settings/team', icon: 'team', label: n.team, badge: null },
        { href: '/settings/webhooks', icon: 'webhook', label: n.webhooks, badge: null },
        { href: '/settings/proactive', icon: 'proactive', label: n.proactive, badge: null },
        { href: '/settings/status-page', icon: 'status', label: n.statusPage, badge: null },
      ],
    },
    {
      title: n.addons,
      items: [{ href: '/settings/addons', icon: 'puzzle', label: n.addonStore, badge: null }],
    },
    {
      title: n.subscription,
      items: [
        { href: '/settings/plans', icon: 'package', label: n.plans, badge: null },
        { href: '/settings/billing', icon: 'billing', label: n.billing, badge: null },
      ],
    },
    {
      title: n.account,
      items: [{ href: '/settings/privacy', icon: 'shield', label: n.privacy, badge: null }],
    },
  ]
}

export function getDashboardPageTitle(pathname: string | null, d: DashboardMessages): string | null {
  if (!pathname) return null
  const t = d.pageTitles
  if (pathname === '/dashboard') return t.dashboard
  if (pathname.startsWith('/inbox')) return t.inbox
  if (pathname.startsWith('/contacts')) return t.contacts
  if (pathname.startsWith('/visitors')) return t.visitors
  if (pathname.startsWith('/analytics')) return t.analytics
  if (pathname === '/settings/plans') return t.plans
  if (pathname === '/settings/general') return t.general
  if (pathname.startsWith('/settings/billing')) return t.billing
  if (pathname.startsWith('/settings/addons')) return t.addons
  if (pathname === '/settings') return t.settings
  if (pathname.startsWith('/settings/')) {
    const segment = pathname.split('/').pop()
    if (segment) return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  }
  return null
}

export function inboxStatusLabels(d: DashboardMessages): Record<string, string> {
  const i = d.inbox
  return {
    OPEN: i.statusOpen,
    PENDING: i.statusPending,
    RESOLVED: i.statusResolved,
    CLOSED: i.statusClosed,
  }
}

export function formatInboxTimeAgo(date: string, d: DashboardMessages): string {
  const c = d.common
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return c.now
  if (diff < 3600) return c.timeMin(Math.floor(diff / 60))
  if (diff < 86400) return c.timeHour(Math.floor(diff / 3600))
  return c.timeDay(Math.floor(diff / 86400))
}

export function formatNotificationTimeAgo(dateStr: string, d: DashboardMessages): string {
  const n = d.notifications
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return n.justNow
  if (minutes < 60) return n.minutesAgo(minutes)
  if (hours < 24) return n.hoursAgo(hours)
  return n.daysAgo(days)
}

export function formatInboxMessageTime(date: string, locale: SiteLocale): string {
  return new Date(date).toLocaleTimeString(locale === 'en' ? 'en-US' : 'tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatInboxDateDivider(date: string, d: DashboardMessages, locale: SiteLocale): string {
  const dt = new Date(date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dt.toDateString() === today.toDateString()) return d.common.today
  if (dt.toDateString() === yesterday.toDateString()) return d.common.yesterday
  return dt.toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function visitorDisplayName(
  name: string | null | undefined,
  email: string | null | undefined,
  d: DashboardMessages
): string {
  return name || email?.split('@')[0] || d.common.anonymous
}
