import type { AiProvider } from '@/lib/ai/provider'
import type { PlanFeature } from '@/lib/plan-shared'
import type { SiteLocale } from './regional-config'

export type ChannelConfigField = {
  key: string
  label: string
  type: string
  placeholder: string
}

export type SettingsMessages = {
  common: {
    save: string
    saving: string
    saved: string
    cancel: string
    create: string
    creating: string
    update: string
    delete: string
    all: string
    loading: string
    back: string
    preview: string
    add: string
    select: string
    optional: string
    auto: string
    manual: string
    nameRequired: string
    saveFailed: string
    connectionError: string
    now: string
    articles: (n: number) => string
    messages: (n: number) => string
    tickets: (n: number) => string
    addons: (n: number) => string
    helpfulPercent: (pct: number) => string
    views: (n: number) => string
    confirmDelete: string
    remove: string
    removing: string
    unnamed: string
    urlRequired: string
    emailRequired: string
    selectAtLeastOneEvent: string
    createFailed: string
    testSuccess: (status: number) => string
    testFailed: string
    testRequestFailed: string
    anonymous: string
    active: string
    inactive: string
    trigger: string
    description: string
    steps: string
    addStep: string
    config: string
    delayMs: string
    noStepsYet: string
  }
  general: {
    pageTitle: string
    pageSubtitle: string
    sectionTitle: string
    websiteName: string
    websiteNamePlaceholder: string
    websiteDomain: string
    domainPlaceholder: string
    nameRequired: string
    savedSuccess: string
  }
  planUpgrade: {
    features: Partial<Record<PlanFeature, string>>
    plans: { STARTER: string; PRO: string; BUSINESS: string }
    defaultDescription: (planName: string) => string
    upgradeButton: string
    addonStore: string
  }
  cannedResponses: {
    title: string
    subtitleBefore: string
    subtitleAfter: string
    newResponse: string
    titlePlaceholder: string
    shortcutPlaceholder: string
    categoryPlaceholder: string
    contentPlaceholder: string
    empty: string
    confirmDelete: string
  }
  ratings: {
    title: string
    subtitle: string
    avgScore: string
    totalRatings: string
    fourFiveStars: string
    empty: string
  }
  team: {
    title: string
    subtitle: string
    inviteMember: string
    inviteTitle: string
    emailPlaceholder: string
    inviteSent: string
    inviteFailed: string
    memberRemoved: string
    removeFailed: string
    sendInvite: string
    roles: { OWNER: string; ADMIN: string; MEMBER: string }
    emptyTitle: string
    emptyHint: string
    planLimitsTitle: string
    planLimitsDesc: string
  }
  privacy: {
    title: string
    subtitle: string
    consentBannerTitle: string
    consentBannerDesc: string
    bannerTextLabel: string
    defaultConsentBannerText: string
    cookieConsentTitle: string
    cookieTextLabel: string
    defaultCookieConsentText: string
    privacyPolicyTitle: string
    privacyPolicyUrlLabel: string
    privacyPolicyUrlPlaceholder: string
    dataRetentionTitle: string
    dataRetentionDesc: string
    visitorDataDays: string
    sessionDataDays: string
    chatHistoryDays: string
    autoDelete: string
    autoDeleteDesc: string
    dpaTitle: string
    dpaDesc: string
    downloadDpa: string
    dpaFilename: string
    buildDpaContent: (params: {
      websiteName: string
      visitorDataDays: number
      sessionDataDays: number
      chatHistoryDays: number
      date: string
    }) => string
  }
  webhooks: {
    title: string
    subtitle: string
    addWebhook: string
    newWebhook: string
    urlLabel: string
    urlPlaceholder: string
    eventsLabel: string
    emptyTitle: string
    emptyHint: string
    failureCount: (n: number) => string
    test: string
    deactivate: string
    activate: string
    confirmDelete: string
    createFailed: string
    securityTitle: string
    securityDescBefore: string
    securityDescAfter: string
    signatureHeader: string
  }
  knowledge: {
    title: string
    subtitle: string
    categories: string
    newArticle: string
    categoriesTitle: string
    categoriesSubtitle: string
    newCategory: string
    editCategory: string
    name: string
    slug: string
    description: string
    icon: string
    categoryNamePlaceholder: string
    slugPlaceholder: string
    descriptionPlaceholder: string
    iconPlaceholder: string
    nameSlugRequired: string
    categoryUpdated: string
    categoryCreated: string
    deleteCategoryConfirm: string
    noCategories: string
    noCategoriesHint: string
    deleteArticleConfirm: string
    searchPlaceholder: string
    status: string
    noArticles: string
    noArticlesHint: string
    createArticle: string
    featured: string
    newArticleTitle: string
    editArticleTitle: string
    titleLabel: string
    titlePlaceholder: string
    slugArticlePlaceholder: string
    excerptLabel: string
    excerptPlaceholder: string
    contentLabel: string
    contentPlaceholder: string
    categoryLabel: string
    selectCategory: string
    featuredArticle: string
    saveDraft: string
    publishing: string
    publish: string
    articleSaved: string
    requiredFields: string
    previewTitle: string
    statusDraft: string
    statusPublished: string
    statusArchived: string
  }
  tickets: {
    title: string
    subtitle: string
    createTicket: string
    searchPlaceholder: string
    noTickets: string
    noTicketsFiltered: string
    noTicketsHint: string
    colId: string
    colSubject: string
    colStatus: string
    colPriority: string
    colChannel: string
    colAssignee: string
    colDate: string
    colMessages: string
    previous: string
    next: string
    newTitle: string
    backToTickets: string
    subject: string
    subjectPlaceholder: string
    customerName: string
    customerNamePlaceholder: string
    customerEmail: string
    customerEmailPlaceholder: string
    channel: string
    priority: string
    description: string
    descriptionPlaceholder: string
    creating: string
    createFailed: string
    notFound: string
    goBack: string
    backToList: string
    messages: string
    noMessages: string
    agent: string
    internalNotes: (n: number) => string
    internalNote: string
    internalNoteTag: string
    reply: string
    replyPlaceholder: string
    internalNotePlaceholder: string
    internalOnly: string
    customerVisible: string
    sendHint: string
    sending: string
    send: string
    addNote: string
    status: string
    assignee: string
    unassigned: string
    created: string
    firstResponse: string
    resolved: string
    closed: string
    statusNew: string
    statusOpen: string
    statusPendingCustomer: string
    statusPendingAgent: string
    statusOnHold: string
    statusResolved: string
    statusClosed: string
    priorityLow: string
    priorityMedium: string
    priorityHigh: string
    priorityUrgent: string
    channelEmail: string
    channelWidget: string
    channelApi: string
    channelWhatsapp: string
    channelMessenger: string
    channelInstagram: string
    channelImport: string
  }
  widget: {
    title: string
    subtitle: string
    subtitleForSite: (name: string) => string
    noSiteSelected: string
    selectSiteHint: string
    noActiveSite: string
    appearance: string
    primaryColor: string
    position: string
    bottomRight: string
    bottomLeft: string
    messages: string
    welcomeMessage: string
    offlineMessage: string
    behavior: string
    preChatForm: string
    preChatFormDesc: string
    requireName: string
    requireNameDesc: string
    requireEmail: string
    requireEmailDesc: string
    soundNotifications: string
    soundNotificationsDesc: string
    autoOpen: string
    autoOpenDesc: string
    livePreview: string
    online: string
    typeMessage: string
    install: string
    installHint: (name: string) => string
    copied: string
    copy: string
    defaultWelcome: string
    defaultOffline: string
  }
  billing: {
    title: string
    subtitle: string
    paymentSuccess: string
    paymentFailed: string
    paymentNotConfigured: string
    paymentStartFailed: string
    cancelConfirm: string
    cancelSuccess: string
    cancelFailed: string
    trialStarted: string
    trialStartFailed: string
    statusActive: string
    statusPastDue: string
    statusTrialEnded: string
    statusCanceled: string
    statusTrialing: string
    trialActive: string
    trialDaysLeft: (days: number) => string
    trialBonusWidget: (days: number) => string
    trialBonusChat: (days: number) => string
    trialBillingTitle: (days: number) => string
    trialBillingSubtitle: (days: number, widgetBonus: number, chatBonus: number) => string
    trialCardHint: string
    startTrial: string
    startingTrial: string
    currentPlan: string
    freePlan: string
    basicFeatures: string
    renewalDate: (date: string) => string
    autoCharge: string
    pastDueWarning: string
    perMonth: string
    cancelSubscription: string
    cancelling: string
    planUpgrade: string
    planUpgradeHint: string
    viewPlans: string
    enterprise: string
    enterpriseTitle: string
    enterpriseDesc: string
    enterpriseFeatures: string[]
    contactUs: string
    paymentDisabledTitle: string
    paymentDisabledDesc: string
    invoiceHistory: string
    viewAll: string
    noInvoices: string
    noInvoicesHint: string
    securePayment: string
    securePaymentHint: string
  }
  invoices: {
    title: string
    subtitle: (site: string) => string
    noInvoices: string
    noInvoicesHint: string
    colInvoice: string
    colPlan: string
    colPeriod: string
    colAmount: string
    colStatus: string
  }
  invoiceStatus: {
    PENDING: string
    PAID: string
    FAILED: string
    REFUNDED: string
  }
  addons: {
    title: string
    subtitle: string
    searchPlaceholder: string
    loading: string
    activeCount: (n: number) => string
    myAddons: string
    featured: string
    popular: string
    allAddons: string
    resultsFor: (query: string, count: number) => string
    addonCount: (n: number) => string
    notFound: string
    notFoundSearch: (query: string) => string
    notFoundCategory: string
    showAll: string
    manage: string
    disable: string
    enable: string
    cancelled: string
    active: string
    inactive: string
    purchasedActive: string
    purchasedInactive: string
    buyNow: string
    buy: string
    free: string
    perMonth: string
    perYear: string
    refundGuarantee: string
    planUpgradeRequired: string
    planIncluded: (plan: string) => string
    planRequired: (plan: string) => string
    purchaseFailed: string
    paymentStartFailed: string
    monthlyFee: string
    proceedToPayment: string
    backToStore: string
    addonNotFound: string
    addonNotFoundHint: string
    status: string
    disabled: string
    purchasedAt: string
    expiresAt: string
    autoRenew: string
    autoRenewOn: string
    autoRenewOff: string
    subscriptionCancelled: (date: string) => string
    description: string
    setupGuide: string
    configuration: string
    selectOption: string
    permissions: string
    cancelSubscription: string
    cancelSubscriptionHint: string
    cancelSubscriptionBtn: string
    processing: string
    operationFailed: string
    featuredBadge: string
    categoryAll: string
    categorySocial: string
    categoryMarketing: string
    categoryAi: string
    categoryAnalytics: string
    categoryCrm: string
    categorySupport: string
    categoryAutomation: string
    categoryEcommerce: string
    categoryCustom: string
    categorySecurity: string
    planFree: string
    planStarter: string
    planPro: string
    planBusiness: string
    cancelConfirm: string
  }
  statusPage: {
    title: string
    subtitle: string
    preview: string
    saved: string
    saving: string
    pageSettings: string
    pageTitle: string
    subdomain: string
    subdomainSuffix: string
    description: string
    logoUrl: string
    twitterHandle: string
    primaryColor: string
    active: string
    showHistory: string
    components: string
    componentNamePlaceholder: string
    add: string
    noComponents: string
    incidents: string
    reportIncident: string
    incidentTitlePlaceholder: string
    incidentMessagePlaceholder: string
    create: string
    noIncidents: string
    compOperational: string
    compDegraded: string
    compPartialOutage: string
    compMajorOutage: string
    compMaintenance: string
    incInvestigating: string
    incIdentified: string
    incMonitoring: string
    incResolved: string
    severityLow: string
    severityMedium: string
    severityHigh: string
    severityUrgent: string
  }
  workflowTriggers: Record<string, string>
  workflowActions: Record<string, string>
  workflows: {
    title: string
    subtitle: string
    createWorkflow: string
    editWorkflow: string
    newWorkflow: string
    workflowName: string
    workflowNamePlaceholder: string
    descriptionPlaceholder: string
    confirmDelete: string
    emptyTitle: string
    emptyHint: string
  }
  chatbot: {
    title: string
    subtitle: string
    newChatbot: string
    botName: string
    botNamePlaceholder: string
    keywords: string
    keywordsPlaceholder: string
    flowSteps: string
    messagePlaceholder: string
    transferPlaceholder: string
    promptPlaceholder: string
    optionText: string
    addOption: string
    createChatbot: string
    createFailed: string
    confirmDelete: string
    deleteFailed: string
    emptyTitle: string
    emptyHint: string
    stepCount: (n: number) => string
    defaultWelcome: string
    dragToReorder: string
    dropHere: string
    addStep: string
    stepTypes: Record<string, { label: string; description: string }>
    triggers: Record<string, string>
  }
  aiBot: {
    title: string
    subtitle: string
    selectSiteFirst: string
    providersTitle: string
    ready: string
    noKey: string
    aiModeActive: string
    freeTierHint: string
    enableAssistant: string
    enableAssistantHint: string
    autoReply: string
    autoReplyHint: string
    autoSuggest: string
    autoSuggestHint: string
    provider: string
    model: string
    creativity: (value: string) => string
    apiKey: string
    apiKeyPlaceholderSaved: string
    apiKeyPlaceholder: string
    systemPrompt: string
    systemPromptPlaceholder: string
    liveTest: string
    defaultTestMessage: string
    askAi: string
    gettingReply: string
    saveSuccess: string
    saveFailed: string
    testFailed: string
    testModeLlm: string
    testModeFallback: string
    planModelsTitle: string
    planModelsHint: (label: string) => string
    modelLocked: string
    platformFallbackHint: string
    providers: Record<AiProvider, string>
  }
  channels: {
    title: string
    subtitle: string
    connected: string
    notConnected: string
    configure: string
    configTitle: (label: string) => string
    addFailed: string
    channelDefs: Record<string, { label: string; description: string }>
    configFields: Record<string, ChannelConfigField[]>
  }
  proactive: {
    title: string
    subtitle: string
    addMessage: string
    editMessage: string
    newMessage: string
    titleLabel: string
    titlePlaceholder: string
    messageLabel: string
    messagePlaceholder: string
    triggerType: string
    triggerValue: string
    targetPages: string
    targetPagesPlaceholder: string
    delaySeconds: string
    showOnce: string
    confirmDelete: string
    emptyTitle: string
    emptyHint: string
    valueLabel: (value: string) => string
    delayLabel: (seconds: number) => string
    showOnceBadge: string
    showEveryTime: string
    pagesLabel: (pages: string) => string
    disable: string
    enable: string
    edit: string
    triggers: Record<string, string>
    triggerPlaceholders: Record<string, string>
  }
  campaigns: {
    title: string
    subtitle: string
    createCampaign: string
    newCampaign: string
    campaignName: string
    campaignNamePlaceholder: string
    type: string
    descriptionPlaceholder: string
    subject: string
    subjectPlaceholder: string
    content: string
    contentPlaceholder: string
    scheduledAt: string
    confirmDelete: string
    confirmSend: string
    sendFailed: string
    sentSuccess: (count: number) => string
    emptyTitle: string
    emptyHint: string
    tableCampaign: string
    tableStatus: string
    tableSent: string
    tableOpens: string
    tableClicks: string
    tableReplies: string
    tableActions: string
    abTest: string
    abTestHint: string
    variantA: string
    variantB: string
    abSplitPercent: string
    abSplitHint: string
    abBadge: string
    tableAbResults: string
    activate: string
    send: string
    sending: string
    pause: string
    resume: string
    statuses: Record<string, string>
    types: Record<string, string>
  }
}

const tr: SettingsMessages = {
  common: {
    save: 'Kaydet',
    saving: 'Kaydediliyor...',
    saved: '✓ Kaydedildi',
    cancel: 'İptal',
    create: 'Oluştur',
    creating: 'Oluşturuluyor...',
    update: 'Güncelle',
    delete: 'Sil',
    all: 'Tümü',
    loading: 'Yükleniyor...',
    back: 'Geri',
    preview: 'Önizle',
    add: 'Ekle',
    select: 'Seçiniz',
    optional: 'opsiyonel',
    auto: 'Otomatik',
    manual: 'Manuel',
    nameRequired: 'Ad ve slug zorunludur',
    saveFailed: 'Kaydetme başarısız',
    connectionError: 'Bağlantı hatası',
    now: 'şimdi',
    articles: (n) => `${n} makale`,
    messages: (n) => `${n} mesaj`,
    tickets: (n) => `${n} ticket`,
    addons: (n) => `${n} eklenti`,
    helpfulPercent: (pct) => `%${pct} faydalı`,
    views: (n) => `${n} görüntülenme`,
    confirmDelete: 'Silmek istediğinize emin misiniz?',
    remove: 'Kaldır',
    removing: 'Kaldırılıyor...',
    unnamed: 'İsimsiz',
    urlRequired: 'URL gerekli',
    emailRequired: 'E-posta adresi gerekli',
    selectAtLeastOneEvent: 'En az bir olay seçin',
    createFailed: 'Oluşturulamadı',
    testSuccess: (status) => `Test başarılı (HTTP ${status})`,
    testFailed: 'Test başarısız',
    testRequestFailed: 'Test isteği gönderilemedi',
    anonymous: 'Anonim',
    active: 'Aktif',
    inactive: 'Pasif',
    trigger: 'Tetikleyici',
    description: 'Açıklama',
    steps: 'Adımlar',
    addStep: '+ Adım Ekle',
    config: 'Yapılandırma',
    delayMs: 'Gecikme ms',
    noStepsYet: 'Henüz adım eklenmedi',
  },
  general: {
    pageTitle: 'Ayarlar',
    pageSubtitle: 'Web sitenizin temel bilgilerini yönetin',
    sectionTitle: 'Genel Ayarlar',
    websiteName: 'Website Adı',
    websiteNamePlaceholder: 'Web sitenizin adı',
    websiteDomain: 'Website Domain',
    domainPlaceholder: 'orneksite.com',
    nameRequired: 'Website adı boş olamaz',
    savedSuccess: 'Ayarlar kaydedildi!',
  },
  planUpgrade: {
    features: {
      chatbot: 'Chatbot',
      knowledgeBase: 'Bilgi Bankası',
      ticketing: 'Bilet Sistemi',
      webhooks: 'Webhook',
      workflows: 'Otomasyon',
      campaigns: 'Kampanyalar',
      cannedResponses: 'Hazır Cevaplar',
      statusPage: 'Durum Sayfası',
      apiAccess: 'API Erişimi',
      advancedAnalytics: 'Gelişmiş Analitik',
      visitorTracking: 'Ziyaretçi Takibi',
      aiAssistant: 'AI Sohbet Asistanı',
      overlayAI: 'Ekran İzleme',
      multiChannel: 'Çoklu Kanal',
      autoTranslate: 'Otomatik Çeviri',
      ratings: 'CSAT Puanlama',
      proactiveMessages: 'Hedefli Mesajlar',
    },
    plans: {
      STARTER: 'Başlangıç',
      PRO: 'Profesyonel',
      BUSINESS: 'Kurumsal',
    },
    defaultDescription: (planName) =>
      `Bu özellik ${planName} paketinde ve üzerinde kullanılabilir. Planınızı yükselterek hemen kullanmaya başlayın.`,
    upgradeButton: 'Paketi Yükselt',
    addonStore: 'Eklenti Mağazası',
  },
  cannedResponses: {
    title: 'Hazır Cevaplar',
    subtitleBefore: "Inbox'ta ",
    subtitleAfter: ' yazarak kullanın',
    newResponse: '+ Yeni Cevap',
    titlePlaceholder: 'Başlık',
    shortcutPlaceholder: 'Kısayol (örn: merhaba)',
    categoryPlaceholder: 'Kategori (isteğe bağlı)',
    contentPlaceholder: 'Mesaj içeriği',
    empty: 'Henüz hazır cevap yok',
    confirmDelete: 'Silmek istediğinize emin misiniz?',
  },
  ratings: {
    title: 'Müşteri Memnuniyeti (CSAT)',
    subtitle: 'Widget üzerinden alınan sohbet puanları',
    avgScore: 'Ortalama puan',
    totalRatings: 'Toplam değerlendirme',
    fourFiveStars: '4-5 yıldız',
    empty: 'Henüz puanlama yok',
  },
  team: {
    title: 'Takım Yönetimi',
    subtitle: 'Temsilcileri yönetin ve yeni üyeler davet edin',
    inviteMember: '+ Üye Davet Et',
    inviteTitle: 'Yeni Üye Davet Et',
    emailPlaceholder: 'E-posta adresi',
    inviteSent: 'Davet gönderildi!',
    inviteFailed: 'Davet gönderilemedi',
    memberRemoved: 'Üye kaldırıldı',
    removeFailed: 'Kaldırma başarısız',
    sendInvite: 'Davet Gönder',
    roles: {
      OWNER: 'Sahip',
      ADMIN: 'Yönetici',
      MEMBER: 'Temsilci',
    },
    emptyTitle: 'Henüz takım üyesi yok',
    emptyHint: 'Yukarıdaki butonu kullanarak üye davet edin',
    planLimitsTitle: 'Plan Limitleri',
    planLimitsDesc:
      'Ücretsiz plan en fazla 2 temsilci destekler. Daha fazla temsilci için planınızı yükseltin.',
  },
  privacy: {
    title: 'Gizlilik & KVKK/GDPR',
    subtitle: 'Gizlilik politikası, veri saklama ve onay ayarlarını yönetin',
    consentBannerTitle: 'KVKK/GDPR Onay Bannerı',
    consentBannerDesc:
      'Ziyaretçilere veri işleme ve çerez politikası hakkında bilgi veren onay bannerı gösterin',
    bannerTextLabel: 'Banner Metni',
    defaultConsentBannerText:
      'Bu site, size daha iyi hizmet verebilmek için çerezler ve kişisel verilerinizi işlemektedir. Devam ederek bunu kabul etmiş olursunuz.',
    cookieConsentTitle: 'Çerez Onayı',
    cookieTextLabel: 'Çerez Açıklaması',
    defaultCookieConsentText: 'Bu site, deneyiminizi iyileştirmek için çerezler kullanmaktadır.',
    privacyPolicyTitle: 'Gizlilik Politikası',
    privacyPolicyUrlLabel: 'Gizlilik Politikası URL',
    privacyPolicyUrlPlaceholder: 'https://ornek.com/gizlilik-politikasi',
    dataRetentionTitle: 'Veri Saklama Politikası',
    dataRetentionDesc:
      'Veri türlerine göre saklama sürelerini belirleyin. Süresi dolan veriler otomatik olarak temizlenir.',
    visitorDataDays: 'Ziyaretçi Verileri (gün)',
    sessionDataDays: 'Oturum Verileri (gün)',
    chatHistoryDays: 'Sohbet Geçmişi (gün)',
    autoDelete: 'Otomatik Silme',
    autoDeleteDesc: 'Süresi dolan verileri otomatik olarak temizle',
    dpaTitle: 'Veri İşleme Sözleşmesi (DPA)',
    dpaDesc: 'KVKK ve GDPR uyumlu Veri İşleme Sözleşmesi’ni indirin',
    downloadDpa: 'DPA Sözleşmesini İndir',
    dpaFilename: 'veri-isleme-sozlesmesi-dpa.txt',
    buildDpaContent: ({ websiteName, visitorDataDays, sessionDataDays, chatHistoryDays, date }) =>
      `VERİ İŞLEME SÖZLEŞMESİ (DPA)\n\nTaraflar:\n${websiteName} (Veri Sorumlusu)\nGu Live Chat (Veri İşleyen)\n\nKapsam:\nBu sözleşme, Gu Live Chat hizmetleri kapsamında kişisel verilerin işlenmesini düzenler.\n\nVeri Kategorileri:\n- İletişim bilgileri (isim, e-posta, telefon)\n- Sohbet mesajları ve konuşma geçmişi\n- Ziyaretçi oturum verileri\n- Teknik veriler (IP adresi, tarayıcı bilgileri)\n\nAmaç:\nMüşteri desteği ve iletişim hizmetlerinin sağlanması.\n\nSaklama Süreleri:\n- Ziyaretçi verileri: ${visitorDataDays} gün\n- Oturum verileri: ${sessionDataDays} gün\n- Sohbet geçmişi: ${chatHistoryDays} gün\n\nİmza:\nTarih: ${date}`,
  },
  webhooks: {
    title: "Webhook'lar",
    subtitle: 'Dış sistemlere gerçek zamanlı bildirimler gönderin',
    addWebhook: '+ Webhook Ekle',
    newWebhook: 'Yeni Webhook',
    urlLabel: 'URL',
    urlPlaceholder: 'https://ornek.com/webhook',
    eventsLabel: 'Olaylar',
    emptyTitle: 'Henüz webhook yok',
    emptyHint: 'Webhook ekleyerek dış sistemlere gerçek zamanlı bildirimler gönderin',
    failureCount: (n) => `${n} başarısız deneme`,
    test: 'Test Et',
    deactivate: 'Pasifleştir',
    activate: 'Aktifleştir',
    confirmDelete: 'Bu webhook silinsin mi?',
    createFailed: 'Webhook oluşturulamadı',
    securityTitle: 'Webhook güvenliği',
    securityDescBefore: 'Her webhook isteği, webhook sırrınız ile imzalanır. İstek doğrulamak için ',
    securityDescAfter: ' header değerini kullanın.',
    signatureHeader: 'X-Gu-Signature',
  },
  knowledge: {
    title: 'Bilgi Bankası',
    subtitle: 'Makale ve kategorileri yönetin',
    categories: 'Kategoriler',
    newArticle: '+ Yeni Makale',
    categoriesTitle: 'Kategoriler',
    categoriesSubtitle: 'Makale kategorilerini yönetin',
    newCategory: '+ Yeni Kategori',
    editCategory: 'Kategori Düzenle',
    name: 'Ad',
    slug: 'Slug',
    description: 'Açıklama',
    icon: 'Emoji / İkon',
    categoryNamePlaceholder: 'Kategori adı',
    slugPlaceholder: 'kategori-slugu',
    descriptionPlaceholder: 'Kısa açıklama (opsiyonel)',
    iconPlaceholder: '📁 (opsiyonel)',
    nameSlugRequired: 'Ad ve slug zorunludur',
    categoryUpdated: 'Kategori güncellendi',
    categoryCreated: 'Kategori oluşturuldu',
    deleteCategoryConfirm: 'Bu kategoriyi silmek istediğinize emin misiniz? Kategoriye bağlı makaleler kategorisiz kalacaktır.',
    noCategories: 'Henüz kategori yok',
    noCategoriesHint: 'Makaleleri kategorilere ayırmak için bir kategori oluşturun',
    deleteArticleConfirm: 'Bu makaleyi silmek istediğinize emin misiniz?',
    searchPlaceholder: 'Makale ara...',
    status: 'Durum',
    noArticles: 'Henüz makale yok',
    noArticlesHint: 'İlk bilgi bankası makalesini oluşturun',
    createArticle: 'Makale Oluştur',
    featured: 'Öne Çıkan',
    newArticleTitle: 'Yeni Makale',
    editArticleTitle: 'Makale Düzenle',
    titleLabel: 'Başlık',
    titlePlaceholder: 'Makale başlığı',
    slugArticlePlaceholder: 'makale-slugu',
    excerptLabel: 'Kısa Açıklama',
    excerptPlaceholder: 'Kısa bir açıklama (opsiyonel)',
    contentLabel: 'İçerik',
    contentPlaceholder: 'Makale içeriğini buraya yazın...',
    categoryLabel: 'Kategori',
    selectCategory: 'Kategori seçin',
    featuredArticle: 'Öne Çıkan Makale',
    saveDraft: 'Taslak Kaydet',
    publishing: 'Yayınlanıyor...',
    publish: 'Yayınla',
    articleSaved: 'Makale kaydedildi!',
    requiredFields: 'Başlık, slug ve içerik zorunludur',
    previewTitle: 'Önizleme',
    statusDraft: 'Taslak',
    statusPublished: 'Yayında',
    statusArchived: 'Arşiv',
  },
  tickets: {
    title: 'Ticket Yönetimi',
    subtitle: 'Müşteri taleplerini yönetin',
    createTicket: '+ Ticket Oluştur',
    searchPlaceholder: 'Ticket ara (konu, e-posta, isim)...',
    noTickets: 'Henüz ticket yok',
    noTicketsFiltered: 'Bu durumda ticket bulunamadı',
    noTicketsHint: 'Yeni bir ticket oluşturun',
    colId: 'ID',
    colSubject: 'Konu',
    colStatus: 'Durum',
    colPriority: 'Öncelik',
    colChannel: 'Kanal',
    colAssignee: 'Atanan',
    colDate: 'Tarih',
    colMessages: 'Mesaj',
    previous: 'Önceki',
    next: 'Sonraki',
    newTitle: 'Yeni Bilet',
    backToTickets: '← Biletler',
    subject: 'Konu *',
    subjectPlaceholder: 'Bilet konusu',
    customerName: 'Müşteri Adı',
    customerNamePlaceholder: 'Ad Soyad',
    customerEmail: 'Müşteri E-posta *',
    customerEmailPlaceholder: 'ornek@domain.com',
    channel: 'Kanal',
    priority: 'Öncelik',
    description: 'Açıklama',
    descriptionPlaceholder: 'Sorunun detaylı açıklaması…',
    creating: 'Oluşturuluyor…',
    createFailed: 'Bilet oluşturulamadı',
    notFound: 'Ticket bulunamadı',
    goBack: 'Geri dön',
    backToList: 'Ticketlere Dön',
    messages: 'Mesajlar',
    noMessages: 'Henüz mesaj yok',
    agent: 'Temsilci',
    internalNotes: (n) => `${n} iç not`,
    internalNote: 'Not',
    internalNoteTag: '(iç not)',
    reply: 'Yanıtla',
    replyPlaceholder: 'Yanıtınızı yazın...',
    internalNotePlaceholder: 'İç not ekleyin...',
    internalOnly: 'Sadece temsilciler görebilir',
    customerVisible: 'Müşteriye gönderilecek',
    sendHint: 'Cmd/Ctrl+Enter',
    sending: 'Gönderiliyor...',
    send: 'Gönder',
    addNote: 'Not Ekle',
    status: 'Durum',
    assignee: 'Atanan Temsilci',
    unassigned: 'Atanmamış',
    created: 'Oluşturulma',
    firstResponse: 'İlk yanıt',
    resolved: 'Çözüm',
    closed: 'Kapanış',
    statusNew: 'Yeni',
    statusOpen: 'Açık',
    statusPendingCustomer: 'Müşteri Bekliyor',
    statusPendingAgent: 'Temsilci Bekliyor',
    statusOnHold: 'Beklemede',
    statusResolved: 'Çözüldü',
    statusClosed: 'Kapalı',
    priorityLow: 'Düşük',
    priorityMedium: 'Orta',
    priorityHigh: 'Yüksek',
    priorityUrgent: 'Acil',
    channelEmail: 'E-posta',
    channelWidget: 'Widget',
    channelApi: 'API',
    channelWhatsapp: 'WhatsApp',
    channelMessenger: 'Messenger',
    channelInstagram: 'Instagram',
    channelImport: 'İçe Aktarma',
  },
  widget: {
    title: 'Widget Ayarları',
    subtitle: 'Chat widget görünümünü ve davranışını özelleştirin',
    subtitleForSite: (name) => `Değişiklikler ${name} sitesinin widget'ına uygulanır.`,
    noSiteSelected: 'Site seçilmedi',
    selectSiteHint: 'Widget ayarları için bir site seçin.',
    noActiveSite: 'Aktif web sitesi bulunamadı',
    appearance: 'Görünüm',
    primaryColor: 'Ana Renk',
    position: 'Pozisyon',
    bottomRight: '↓ Sağ Alt',
    bottomLeft: '↓ Sol Alt',
    messages: 'Mesajlar',
    welcomeMessage: 'Hoş Geldin Mesajı',
    offlineMessage: 'Çevrimdışı Mesajı',
    behavior: 'Davranış',
    preChatForm: 'Sohbet öncesi form',
    preChatFormDesc: 'Kapalıyken ziyaretçi doğrudan mesaj yazar. Açıkken isteğe bağlı alanları seçin.',
    requireName: 'İsim iste',
    requireNameDesc: 'Formda isim alanı gösterilsin (zorunlu değil)',
    requireEmail: 'E-posta iste',
    requireEmailDesc: 'Formda e-posta alanı gösterilsin (zorunlu değil)',
    soundNotifications: 'Ses bildirimleri',
    soundNotificationsDesc: 'Ziyaretçi tarafında yeni mesaj sesi (yakında)',
    autoOpen: 'Otomatik açılma',
    autoOpenDesc: 'Sayfa yüklendikten sonra widget otomatik açılsın (yakında)',
    livePreview: 'Canlı Önizleme',
    online: 'Çevrimiçi',
    typeMessage: 'Mesajınızı yazın...',
    install: 'Widget Kurulumu',
    installHint: (name) => `Bu kod yalnızca ${name} sitesine aittir.`,
    copied: '✓ Kopyalandı!',
    copy: 'Kopyala',
    defaultWelcome: 'Merhaba! Size nasıl yardımcı olabiliriz?',
    defaultOffline: 'Şu an çevrimdışısınız. Bir mesaj bırakın, size dönelim.',
  },
  billing: {
    title: 'Faturalama',
    subtitle: 'Planınızı yönetin ve fatura bilgilerinizi görüntüleyin',
    paymentSuccess: 'Ödeme başarıyla tamamlandı! Planınız güncelleniyor...',
    paymentFailed: 'Ödeme başarısız oldu. Lütfen tekrar deneyin.',
    paymentNotConfigured: 'Ödeme sistemi henüz yapılandırılmamış. Lütfen yöneticinizle iletişime geçin.',
    paymentStartFailed: 'Ödeme başlatılamadı',
    cancelConfirm: 'Aboneliğinizi iptal etmek istediğinize emin misiniz? Planınız ücretsiz plana döndürülecektir.',
    cancelSuccess: 'Abonelik başarıyla iptal edildi.',
    cancelFailed: 'İptal başarısız',
    trialStarted: 'PRO deneme süresi başlatıldı!',
    trialStartFailed: 'Deneme başlatılamadı',
    statusActive: 'Aktif',
    statusPastDue: 'Ödeme Bekliyor',
    statusTrialEnded: 'Deneme Bitti',
    statusCanceled: 'İptal Edildi',
    statusTrialing: 'Deneme',
    trialActive: 'PRO Plan Deneme Süresi Aktif',
    trialDaysLeft: (days) => `Deneme sürenizin dolmasına ${days} gün kaldı`,
    trialBonusWidget: (days) => ` · Widget kurunca +${days} gün`,
    trialBonusChat: (days) => ` · İlk sohbetle +${days} gün`,
    trialBillingTitle: (days) => `${days} Gün Ücretsiz PRO Deneyin`,
    trialBillingSubtitle: (days, widgetBonus, chatBonus) =>
      `${days} gün boyunca tüm PRO özellikleri. Başlatmak için kredi kartı bilgilerinizi girin; kartınız kayıtlıysa veya hesabınızda aktif bakiye varsa doğrudan başlar. Widget kurunca +${widgetBonus}, ilk sohbetle +${chatBonus} gün daha.`,
    trialCardHint: 'Deneme bitiminde PRO plan ücreti kayıtlı kartınızdan tahsil edilir. İstediğiniz zaman iptal edebilirsiniz.',
    startTrial: 'Kart ile Denemeyi Başlat',
    startingTrial: 'Başlatılıyor…',
    currentPlan: 'Mevcut Planınız',
    freePlan: 'Ücretsiz',
    basicFeatures: 'Temel özellikler',
    renewalDate: (date) => `Yenileme tarihi: ${date}`,
    autoCharge: ' — kayıtlı kartınızdan otomatik tahsil edilir',
    pastDueWarning: '⚠️ Ödeme alınamadı. Lütfen ödeme bilgilerinizi güncelleyin.',
    perMonth: '/ay',
    cancelSubscription: 'Aboneliği İptal Et',
    cancelling: 'İptal ediliyor...',
    planUpgrade: 'Plan Yükseltme',
    planUpgradeHint: 'Paket satın almak için Paketler sayfasına gidin — ödeme iyzico ile güvenli alınır.',
    viewPlans: 'Paketleri Gör',
    enterprise: 'Kurumsal',
    enterpriseTitle: 'Daha büyük ekip çalışmaları için bizimle iletişime geçin',
    enterpriseDesc: 'Özel entegrasyon, white-label, kişiselleştirilmiş SLA ve ekip eğitimi için kurumsal çözümler sunuyoruz.',
    enterpriseFeatures: [
      'Özel onboarding programı',
      'Kişiselleştirilmiş SLA',
      'Özel özellik geliştirme',
      'Benzersiz fiyatlandırma',
      'Ekip eğitimi & danışmanlık',
    ],
    contactUs: 'İletişime Geç',
    paymentDisabledTitle: 'Ödeme sistemi yapılandırılmamış',
    paymentDisabledDesc: 'iyzico API bilgileri henüz girilmemiş. Yöneticinizle iletişime geçin veya .env dosyasında iyzico ayarlarını yapılandırın.',
    invoiceHistory: 'Fatura Geçmişi',
    viewAll: 'Tümünü Gör →',
    noInvoices: 'Henüz fatura bulunmuyor',
    noInvoicesHint: 'Ücretli bir plana geçtiğinizde faturalar burada görünecek',
    securePayment: 'Güvenli Ödeme — iyzico',
    securePaymentHint: '256-bit SSL · iyzico güvenli ödeme',
  },
  invoices: {
    title: 'Fatura Geçmişi',
    subtitle: (site) => `${site} faturaları`,
    noInvoices: 'Henüz fatura bulunmuyor',
    noInvoicesHint: 'Bir ödeme yaptığınızda faturalar burada görünecek',
    colInvoice: 'Fatura',
    colPlan: 'Plan',
    colPeriod: 'Dönem',
    colAmount: 'Tutar',
    colStatus: 'Durum',
  },
  invoiceStatus: {
    PENDING: 'Bekliyor',
    PAID: 'Ödendi',
    FAILED: 'Başarısız',
    REFUNDED: 'İade Edildi',
  },
  addons: {
    title: 'Eklenti Mağazası',
    subtitle: 'Platformunuzu güçlendirecek premium eklentiler',
    searchPlaceholder: 'Eklenti ara...',
    loading: 'Mağaza yükleniyor...',
    activeCount: (n) => `${n} aktif`,
    myAddons: 'Eklentilerim',
    featured: 'Öne Çıkan Eklentiler',
    popular: 'Popüler',
    allAddons: 'Tüm Eklentiler',
    resultsFor: (query, count) => `"${query}" için ${count} sonuç`,
    addonCount: (n) => `${n} eklenti`,
    notFound: 'Eklenti bulunamadı',
    notFoundSearch: (query) => `"${query}" ile eşleşen bir eklenti bulamadık. Farklı bir arama terimi deneyin.`,
    notFoundCategory: 'Bu kategoride henüz bir eklenti bulunmuyor. Farklı bir kategori seçmeyi deneyin.',
    showAll: 'Tümünü Göster',
    manage: 'Yönet',
    disable: 'Devre Dışı',
    enable: 'Aktifleştir',
    cancelled: 'İptal',
    active: 'Aktif',
    inactive: 'Pasif',
    purchasedActive: 'Satın Alındı • Aktif',
    purchasedInactive: 'Satın Alındı • Pasif',
    buyNow: 'Hemen Satın Al',
    buy: 'Satın Al',
    free: 'Ücretsiz',
    perMonth: '/ay',
    perYear: '/yıl',
    refundGuarantee: '14 gün para iade garantisi',
    planUpgradeRequired: 'Plan yükseltme veya eklenti satın alma gerekli',
    planIncluded: (plan) => `✓ ${plan} dahil`,
    planRequired: (plan) => `${plan}+`,
    purchaseFailed: 'Satın alma başarısız',
    paymentStartFailed: 'Ödeme başlatılamadı',
    monthlyFee: 'Aylık Ücret',
    proceedToPayment: 'Ödemeye Geç',
    backToStore: 'Mağazaya Dön',
    addonNotFound: 'Eklenti bulunamadı',
    addonNotFoundHint: 'Bu eklenti mevcut değil veya kaldırılmış',
    status: 'Durum',
    disabled: 'Devre Dışı',
    purchasedAt: 'Satın Alınma',
    expiresAt: 'Bitiş Tarihi',
    autoRenew: 'Otomatik Yenileme',
    autoRenewOn: 'Aktif',
    autoRenewOff: 'Kapalı',
    subscriptionCancelled: (date) => `Abonelik iptal edildi — ${date}`,
    description: 'Açıklama',
    setupGuide: 'Kurulum Kılavuzu',
    configuration: 'Yapılandırma',
    selectOption: 'Seçiniz',
    permissions: 'İzinler',
    cancelSubscription: 'Aboneliği İptal Et',
    cancelSubscriptionHint: 'İptal edildiğinde dönem sonuna kadar kullanmaya devam edebilirsiniz',
    cancelSubscriptionBtn: 'Aboneliği İptal Et',
    processing: 'İşleniyor...',
    operationFailed: 'İşlem başarısız',
    featuredBadge: 'Öne Çıkan',
    categoryAll: 'Tümü',
    categorySocial: 'Sosyal',
    categoryMarketing: 'Pazarlama',
    categoryAi: 'AI',
    categoryAnalytics: 'Analitik',
    categoryCrm: 'CRM',
    categorySupport: 'Destek',
    categoryAutomation: 'Otomasyon',
    categoryEcommerce: 'E-ticaret',
    categoryCustom: 'Özel',
    categorySecurity: 'Güvenlik',
    planFree: 'Ücretsiz',
    planStarter: 'Başlangıç',
    planPro: 'Profesyonel',
    planBusiness: 'Kurumsal',
    cancelConfirm: 'Aboneliğinizi iptal etmek istediğinize emin misiniz? Eklenti, dönem sonunda devre dışı kalacaktır.',
  },
  statusPage: {
    title: 'Durum Sayfası',
    subtitle: 'Sistem durumunuzu müşterilerinizle paylaşın',
    preview: 'Önizle',
    saved: '✓ Kaydedildi',
    saving: 'Kaydediliyor...',
    pageSettings: 'Sayfa Ayarları',
    pageTitle: 'Başlık',
    subdomain: 'Alt Alan Adı',
    subdomainSuffix: '.gulivechat.com',
    description: 'Açıklama',
    logoUrl: 'Logo URL',
    twitterHandle: 'Twitter Kullanıcı Adı',
    primaryColor: 'Ana Renk',
    active: 'Aktif',
    showHistory: 'Geçmişi Göster',
    components: 'Bileşenler',
    componentNamePlaceholder: 'Bileşen adı',
    add: 'Ekle',
    noComponents: 'Henüz bileşen eklenmemiş. Önce durum sayfasını kaydedin.',
    incidents: 'Olaylar',
    reportIncident: '+ Olay Bildir',
    incidentTitlePlaceholder: 'Olay başlığı',
    incidentMessagePlaceholder: 'Olay açıklaması',
    create: 'Oluştur',
    noIncidents: 'Henüz bir olay bildirilmemiş.',
    compOperational: 'Çalışıyor',
    compDegraded: 'Yavaşlama',
    compPartialOutage: 'Kısmi Kesinti',
    compMajorOutage: 'Büyük Kesinti',
    compMaintenance: 'Bakımda',
    incInvestigating: 'İnceleniyor',
    incIdentified: 'Tespit Edildi',
    incMonitoring: 'İzleniyor',
    incResolved: 'Çözüldü',
    severityLow: 'Düşük',
    severityMedium: 'Orta',
    severityHigh: 'Yüksek',
    severityUrgent: 'Acil',
  },
  workflowTriggers: {
    CONVERSATION_CREATED: 'Görüşme Oluşturuldu',
    CONVERSATION_RESOLVED: 'Görüşme Çözüldü',
    CONVERSATION_CLOSED: 'Görüşme Kapatıldı',
    MESSAGE_RECEIVED: 'Mesaj Alındı',
    VISITOR_CREATED: 'Ziyaretçi Oluşturuldu',
    VISITOR_SEEN_PAGE: 'Sayfa Görüntülendi',
    TICKET_CREATED: 'Bilet Oluşturuldu',
    TICKET_UPDATED: 'Bilet Güncellendi',
    SCHEDULED: 'Zamanlanmış',
    WEBHOOK_RECEIVED: 'Webhook Alındı',
  },
  workflowActions: {
    SEND_MESSAGE: 'Mesaj Gönder',
    SEND_EMAIL: 'E-posta Gönder',
    ASSIGN_AGENT: 'Temsilci Ata',
    CHANGE_STATUS: 'Durumu Değiştir',
    SET_PRIORITY: 'Öncelik Belirle',
    ADD_TAG: 'Etiket Ekle',
    REMOVE_TAG: 'Etiket Kaldır',
    FORWARD_TO_WEBHOOK: "Webhook'a İlet",
    ADD_NOTE: 'Not Ekle',
    TRIGGER_CHATBOT: 'Chatbot Tetikle',
    SEND_NOTIFICATION: 'Bildirim Gönder',
    DELAY: 'Bekleme',
    CONDITIONAL_BRANCH: 'Koşullu Dal',
  },
  workflows: {
    title: 'Otomasyonlar',
    subtitle: 'Tekrarlayan işleri otomatikleştirin',
    createWorkflow: '+ İş Akışı Oluştur',
    editWorkflow: 'İş Akışını Düzenle',
    newWorkflow: 'Yeni İş Akışı',
    workflowName: 'İş Akışı Adı',
    workflowNamePlaceholder: 'İş akışı adı',
    descriptionPlaceholder: 'Açıklama',
    confirmDelete: 'Bu iş akışını silmek istediğinize emin misiniz?',
    emptyTitle: 'Henüz iş akışı yok',
    emptyHint: 'İlk otomasyonunuzu oluşturun',
  },
  chatbot: {
    title: 'Chatbot',
    subtitle: 'Otomatik yanıt akışları oluşturun',
    newChatbot: '+ Yeni Chatbot',
    botName: 'Chatbot Adı',
    botNamePlaceholder: 'Örn: Hoş Geldin Bot',
    keywords: 'Anahtar Kelimeler',
    keywordsPlaceholder: 'fiyat, sipariş, destek (virgülle ayırın)',
    flowSteps: 'Akış Adımları',
    messagePlaceholder: 'Mesaj metni...',
    transferPlaceholder: 'Aktarım mesajı...',
    promptPlaceholder: 'İstem mesajı...',
    optionText: 'Seçenek metni',
    addOption: '+ Seçenek Ekle',
    createChatbot: 'Chatbot Oluştur',
    createFailed: 'Chatbot oluşturulamadı',
    confirmDelete: 'Bu chatbotu silmek istediğinize emin misiniz?',
    deleteFailed: 'Chatbot silinemedi',
    emptyTitle: 'Henüz chatbot yok',
    emptyHint: 'Yukarıdaki butonu kullanarak ilk chatbotunuzu oluşturun',
    stepCount: (n) => `${n} adım`,
    defaultWelcome: 'Merhaba! Size nasıl yardımcı olabiliriz?',
    dragToReorder: 'Sürükleyerek sıralayın',
    dropHere: 'Buraya bırakın',
    addStep: 'Adım Ekle',
    stepTypes: {
      MESSAGE: { label: 'Mesaj', description: 'Bir metin mesajı gönder' },
      CHOICE: { label: 'Seçenek', description: 'Tıklanabilir seçenekler sun' },
      COLLECT_EMAIL: { label: 'E-posta Topla', description: 'Ziyaretçiden e-posta al' },
      COLLECT_NAME: { label: 'İsim Topla', description: 'Ziyaretçiden isim al' },
      ASSIGN_AGENT: { label: 'Temsilciye Aktar', description: 'Sohbeti temsilciye aktar' },
      END: { label: 'Bitir', description: 'Sohbeti sonlandır' },
    },
    triggers: {
      ALL_CONVERSATIONS: 'Tüm sohbetler',
      OFFLINE_ONLY: 'Sadece çevrimdışı',
      KEYWORD: 'Anahtar kelime tetiklendiğinde',
      FIRST_VISIT: 'İlk ziyarette',
    },
  },
  aiBot: {
    title: 'AI Sohbet Asistanı',
    subtitle: 'GPT, Gemini, Claude, Groq, OpenRouter (ücretsiz Llama/Gemma) veya Ollama ile doğal sohbet.',
    selectSiteFirst: 'Önce bir site seçin.',
    providersTitle: 'AI Sağlayıcıları',
    ready: 'Hazır',
    noKey: 'Anahtar yok',
    aiModeActive: '✓ Gerçek yapay zeka modu aktif — ziyaretçilerle akıllı sohbet edebilirsiniz.',
    freeTierHint:
      'Ücretsiz açık kaynak için: OPENROUTER_API_KEY (openrouter.ai) veya GEMINI_API_KEY. Kendi sunucu: OLLAMA_BASE_URL. Anahtar olmadan sadece basit SSS yanıtları verilir.',
    enableAssistant: 'AI asistanı etkinleştir',
    enableAssistantHint: 'Widget, WhatsApp ve tüm kanallarda AI açılır.',
    autoReply: 'Otomatik sohbet yanıtı',
    autoReplyHint: 'Ziyaretçi mesajına anında akıllı cevap. Temsilci atanınca durur.',
    autoSuggest: 'Temsilci için yanıt önerisi',
    autoSuggestHint: 'Gelen kutusunda AI ile yanıt taslağı.',
    provider: 'Sağlayıcı',
    model: 'Model',
    creativity: (value) => `Yaratıcılık (${value})`,
    apiKey: 'API Anahtarı (opsiyonel)',
    apiKeyPlaceholderSaved: '•••••••• (kayıtlı)',
    apiKeyPlaceholder: 'Siteye özel anahtar — boş bırakırsanız sunucu anahtarı kullanılır',
    systemPrompt: 'Kişilik / Sistem Talimatı',
    systemPromptPlaceholder:
      'Örn: Sen X markasının satış danışmanısın. Samimi konuş, ürünleri öner, fiyat sorulunca paketleri anlat...',
    liveTest: 'Canlı Test',
    defaultTestMessage: 'Merhaba, fiyatlarınız hakkında bilgi alabilir miyim?',
    askAi: "AI'ya sor",
    gettingReply: 'Yanıt alınıyor...',
    saveSuccess: 'AI asistan ayarları kaydedildi.',
    saveFailed: 'Ayarlar kaydedilemedi',
    testFailed: 'Test başarısız',
    testModeLlm: 'Gerçek AI (LLM)',
    testModeFallback: 'Yedek mod (bilgi tabanı)',
    planModelsTitle: 'Paketinize dahil modeller',
    planModelsHint: (label) => `Mevcut paketiniz: ${label}. Üst paketlerde daha güçlü modeller açılır.`,
    modelLocked: ' — üst paket gerekli',
    platformFallbackHint:
      'Tüm sağlayıcılar platform Gemini anahtarı ile çalışır. Kendi OpenAI/Groq anahtarınızı eklerseniz doğrudan o sağlayıcı kullanılır.',
    providers: {
      OPENAI: 'OpenAI (GPT)',
      ANTHROPIC: 'Anthropic (Claude)',
      GEMINI: 'Google Gemini',
      GROQ: 'Groq (Llama — açık kaynak)',
      OPENROUTER: 'OpenRouter (ücretsiz açık kaynak modeller)',
      OLLAMA: 'Ollama (kendi sunucunuz — tamamen açık kaynak)',
    },
  },
  channels: {
    title: 'Kanallar',
    subtitle: 'Çoklu kanal iletişim entegrasyonlarını yönetin',
    connected: 'Bağlı',
    notConnected: 'Bağlı Değil',
    configure: 'Yapılandır',
    configTitle: (label) => `${label} Yapılandırma`,
    addFailed: 'Kanal eklenemedi',
    channelDefs: {
      WHATSAPP: { label: 'WhatsApp', description: 'WhatsApp Business API entegrasyonu' },
      EMAIL: { label: 'E-posta', description: 'E-posta kanalı (SMTP/IMAP)' },
      MESSENGER: { label: 'Facebook Messenger', description: 'Facebook Messenger entegrasyonu' },
      INSTAGRAM: { label: 'Instagram', description: 'Instagram DM entegrasyonu' },
      TELEGRAM: { label: 'Telegram', description: 'Telegram Bot entegrasyonu' },
      SLACK: { label: 'Slack', description: 'Slack entegrasyonu' },
      SMS: { label: 'SMS', description: 'Twilio SMS entegrasyonu' },
    },
    configFields: {
      WHATSAPP: [
        { key: 'phoneNumberId', label: 'Telefon Numarası ID', type: 'text', placeholder: 'WhatsApp Business Phone ID' },
        { key: 'accessToken', label: 'Erişim Tokeni', type: 'password', placeholder: 'WhatsApp Access Token' },
      ],
      EMAIL: [
        { key: 'smtpHost', label: 'SMTP Sunucusu', type: 'text', placeholder: 'smtp.ornek.com' },
        { key: 'smtpPort', label: 'SMTP Port', type: 'text', placeholder: '587' },
        { key: 'smtpUser', label: 'SMTP Kullanıcı', type: 'text', placeholder: 'kullanici@ornek.com' },
        { key: 'smtpPass', label: 'SMTP Şifre', type: 'password', placeholder: 'SMTP şifresi' },
      ],
      MESSENGER: [
        { key: 'pageId', label: 'Sayfa ID', type: 'text', placeholder: 'Facebook Sayfa ID' },
        { key: 'pageAccessToken', label: 'Sayfa Erişim Tokeni', type: 'password', placeholder: 'Page Access Token' },
      ],
      INSTAGRAM: [
        { key: 'businessAccountId', label: 'İşletme Hesabı ID', type: 'text', placeholder: 'Instagram Business Account ID' },
        { key: 'accessToken', label: 'Erişim Tokeni', type: 'password', placeholder: 'Instagram Access Token' },
      ],
      TELEGRAM: [
        { key: 'botToken', label: 'Bot Tokeni', type: 'password', placeholder: 'Telegram Bot Token' },
      ],
      SLACK: [
        { key: 'botToken', label: 'Bot Tokeni', type: 'password', placeholder: 'xoxb-...' },
        { key: 'signingSecret', label: 'İmza Sırrı', type: 'password', placeholder: 'Signing Secret' },
      ],
      SMS: [
        { key: 'accountSid', label: 'Twilio Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxx' },
        { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Twilio Auth Token' },
        { key: 'phoneNumber', label: 'Telefon Numarası', type: 'text', placeholder: '+901234567890' },
      ],
    },
  },
  proactive: {
    title: 'Hedefli Mesajlar',
    subtitle: 'Ziyaretçilere belirli tetikleyicilere göre otomatik mesaj gösterin',
    addMessage: 'Yeni Mesaj Ekle',
    editMessage: 'Mesajı Düzenle',
    newMessage: 'Yeni Hedefli Mesaj',
    titleLabel: 'Başlık',
    titlePlaceholder: 'Mesaj başlığı',
    messageLabel: 'Mesaj',
    messagePlaceholder: 'Mesaj içeriği',
    triggerType: 'Tetikleyici Tipi',
    triggerValue: 'Tetikleyici Değeri',
    targetPages: 'Hedef Sayfalar (JSON dizi veya *, boş bırakılırsa tüm sayfalar)',
    targetPagesPlaceholder: '["/fiyat", "/iletisim"] veya *',
    delaySeconds: 'Gecikme (saniye)',
    showOnce: 'Bir kere göster',
    confirmDelete: 'Bu hedefli mesajı silmek istediğinize emin misiniz?',
    emptyTitle: 'Henüz hedefli mesaj yok',
    emptyHint: 'Yeni bir mesaj oluşturmak için yukarıdaki butonu kullanın',
    valueLabel: (value) => `Değer: ${value}`,
    delayLabel: (seconds) => `Gecikme: ${seconds}s`,
    showOnceBadge: 'Bir kere',
    showEveryTime: 'Her seferinde',
    pagesLabel: (pages) => `Sayfalar: ${pages}`,
    disable: 'Devre dışı bırak',
    enable: 'Aktifleştir',
    edit: 'Düzenle',
    triggers: {
      TIME_ON_PAGE: 'Süre/Sayfada Kalma',
      SCROLL_DEPTH: 'Kaydırma Derinliği',
      EXIT_INTENT: 'Çıkış Niyeti',
      PAGE_VISIT: 'Sayfa Ziyareti',
      CUSTOM: 'Özel',
    },
    triggerPlaceholders: {
      TIME_ON_PAGE: 'Saniye (örn: 30)',
      SCROLL_DEPTH: 'Yüzde (örn: 50)',
      EXIT_INTENT: '-',
      PAGE_VISIT: 'URL (örn: /fiyat)',
      CUSTOM: 'Değer',
    },
  },
  campaigns: {
    title: 'Kampanyalar',
    subtitle: 'E-posta ve bildirim kampanyalarını yönetin',
    createCampaign: '+ Kampanya Oluştur',
    newCampaign: 'Yeni Kampanya',
    campaignName: 'Kampanya Adı',
    campaignNamePlaceholder: 'Kampanya adı',
    type: 'Tür',
    descriptionPlaceholder: 'Kampanya açıklaması',
    subject: 'Konu',
    subjectPlaceholder: 'E-posta konusu',
    content: 'İçerik',
    contentPlaceholder: 'Kampanya içeriği',
    scheduledAt: 'Planlanan Tarih',
    confirmDelete: 'Bu kampanyayı silmek istediğinize emin misiniz?',
    confirmSend: 'Bu kampanyayı şimdi göndermek istediğinize emin misiniz?',
    sendFailed: 'Kampanya gönderilemedi',
    sentSuccess: (count) => `Kampanya gönderildi: ${count} alıcı`,
    emptyTitle: 'Henüz kampanya yok',
    emptyHint: 'İlk kampanyanızı oluşturun',
    tableCampaign: 'Kampanya',
    tableStatus: 'Durum',
    tableSent: 'Gönderim',
    tableOpens: 'Açılma',
    tableClicks: 'Tıklama',
    tableReplies: 'Yanıt',
    tableActions: 'İşlem',
    abTest: 'A/B Testi',
    abTestHint: 'İki farklı konu ve içerik varyantını karşılaştırın',
    variantA: 'Varyant A',
    variantB: 'Varyant B',
    abSplitPercent: 'A varyantı oranı (%)',
    abSplitHint: 'Kalan alıcılar B varyantını alır',
    abBadge: 'A/B',
    tableAbResults: 'A/B Sonuçları',
    activate: 'Aktifleştir',
    send: 'Gönder',
    sending: 'Gönderiliyor...',
    pause: 'Duraklat',
    resume: 'Devam Ettir',
    statuses: {
      DRAFT: 'Taslak',
      ACTIVE: 'Aktif',
      PAUSED: 'Duraklatıldı',
      COMPLETED: 'Tamamlandı',
      CANCELLED: 'İptal Edildi',
    },
    types: {
      EMAIL: 'E-posta',
      IN_APP: 'Uygulama İçi',
      BROADCAST: 'Toplu Mesaj',
    },
  },
}

const en: SettingsMessages = {
  common: {
    save: 'Save',
    saving: 'Saving...',
    saved: '✓ Saved',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating...',
    update: 'Update',
    delete: 'Delete',
    all: 'All',
    loading: 'Loading...',
    back: 'Back',
    preview: 'Preview',
    add: 'Add',
    select: 'Select',
    optional: 'optional',
    auto: 'Auto',
    manual: 'Manual',
    nameRequired: 'Name and slug are required',
    saveFailed: 'Save failed',
    connectionError: 'Connection error',
    now: 'now',
    articles: (n) => `${n} article${n === 1 ? '' : 's'}`,
    messages: (n) => `${n} message${n === 1 ? '' : 's'}`,
    tickets: (n) => `${n} ticket${n === 1 ? '' : 's'}`,
    addons: (n) => `${n} add-on${n === 1 ? '' : 's'}`,
    helpfulPercent: (pct) => `${pct}% helpful`,
    views: (n) => `${n} view${n === 1 ? '' : 's'}`,
    confirmDelete: 'Are you sure you want to delete this?',
    remove: 'Remove',
    removing: 'Removing...',
    unnamed: 'Unnamed',
    urlRequired: 'URL is required',
    emailRequired: 'Email address is required',
    selectAtLeastOneEvent: 'Select at least one event',
    createFailed: 'Could not create',
    testSuccess: (status) => `Test succeeded (HTTP ${status})`,
    testFailed: 'Test failed',
    testRequestFailed: 'Could not send test request',
    anonymous: 'Anonymous',
    active: 'Active',
    inactive: 'Inactive',
    trigger: 'Trigger',
    description: 'Description',
    steps: 'Steps',
    addStep: '+ Add Step',
    config: 'Configuration',
    delayMs: 'Delay (ms)',
    noStepsYet: 'No steps added yet',
  },
  general: {
    pageTitle: 'Settings',
    pageSubtitle: 'Manage your website basics',
    sectionTitle: 'General Settings',
    websiteName: 'Website name',
    websiteNamePlaceholder: 'Your website name',
    websiteDomain: 'Website domain',
    domainPlaceholder: 'example.com',
    nameRequired: 'Website name cannot be empty',
    savedSuccess: 'Settings saved!',
  },
  planUpgrade: {
    features: {
      chatbot: 'Chatbot',
      knowledgeBase: 'Knowledge Base',
      ticketing: 'Ticketing',
      webhooks: 'Webhooks',
      workflows: 'Automations',
      campaigns: 'Campaigns',
      cannedResponses: 'Canned Responses',
      statusPage: 'Status Page',
      apiAccess: 'API Access',
      advancedAnalytics: 'Advanced Analytics',
      visitorTracking: 'Visitor Tracking',
      aiAssistant: 'AI Chat Assistant',
      overlayAI: 'Screen Monitoring',
      multiChannel: 'Multi-Channel',
      autoTranslate: 'Auto Translate',
      ratings: 'CSAT Ratings',
      proactiveMessages: 'Proactive Messages',
    },
    plans: {
      STARTER: 'Starter',
      PRO: 'Professional',
      BUSINESS: 'Business',
    },
    defaultDescription: (planName) =>
      `This feature is available on the ${planName} plan and above. Upgrade your plan to start using it right away.`,
    upgradeButton: 'Upgrade plan',
    addonStore: 'Add-on Store',
  },
  cannedResponses: {
    title: 'Canned Responses',
    subtitleBefore: 'Type ',
    subtitleAfter: ' in the inbox to use them',
    newResponse: '+ New response',
    titlePlaceholder: 'Title',
    shortcutPlaceholder: 'Shortcut (e.g. hello)',
    categoryPlaceholder: 'Category (optional)',
    contentPlaceholder: 'Message content',
    empty: 'No canned responses yet',
    confirmDelete: 'Are you sure you want to delete this?',
  },
  ratings: {
    title: 'Customer Satisfaction (CSAT)',
    subtitle: 'Chat ratings collected via the widget',
    avgScore: 'Average score',
    totalRatings: 'Total ratings',
    fourFiveStars: '4–5 stars',
    empty: 'No ratings yet',
  },
  team: {
    title: 'Team Management',
    subtitle: 'Manage agents and invite new members',
    inviteMember: '+ Invite member',
    inviteTitle: 'Invite new member',
    emailPlaceholder: 'Email address',
    inviteSent: 'Invitation sent!',
    inviteFailed: 'Could not send invitation',
    memberRemoved: 'Member removed',
    removeFailed: 'Could not remove member',
    sendInvite: 'Send invite',
    roles: {
      OWNER: 'Owner',
      ADMIN: 'Admin',
      MEMBER: 'Agent',
    },
    emptyTitle: 'No team members yet',
    emptyHint: 'Use the button above to invite members',
    planLimitsTitle: 'Plan limits',
    planLimitsDesc:
      'The free plan supports up to 2 agents. Upgrade your plan for more team members.',
  },
  privacy: {
    title: 'Privacy & GDPR',
    subtitle: 'Manage privacy policy, data retention, and consent settings',
    consentBannerTitle: 'GDPR consent banner',
    consentBannerDesc:
      'Show a consent banner informing visitors about data processing and cookie policies',
    bannerTextLabel: 'Banner text',
    defaultConsentBannerText:
      'This site processes cookies and personal data to provide you with a better experience. By continuing, you accept this.',
    cookieConsentTitle: 'Cookie consent',
    cookieTextLabel: 'Cookie description',
    defaultCookieConsentText: 'This site uses cookies to improve your experience.',
    privacyPolicyTitle: 'Privacy policy',
    privacyPolicyUrlLabel: 'Privacy policy URL',
    privacyPolicyUrlPlaceholder: 'https://example.com/privacy-policy',
    dataRetentionTitle: 'Data retention policy',
    dataRetentionDesc:
      'Set retention periods by data type. Expired data is automatically cleaned up.',
    visitorDataDays: 'Visitor data (days)',
    sessionDataDays: 'Session data (days)',
    chatHistoryDays: 'Chat history (days)',
    autoDelete: 'Auto-delete',
    autoDeleteDesc: 'Automatically clean up expired data',
    dpaTitle: 'Data Processing Agreement (DPA)',
    dpaDesc: 'Download a GDPR-compliant Data Processing Agreement',
    downloadDpa: 'Download DPA',
    dpaFilename: 'data-processing-agreement-dpa.txt',
    buildDpaContent: ({ websiteName, visitorDataDays, sessionDataDays, chatHistoryDays, date }) =>
      `DATA PROCESSING AGREEMENT (DPA)\n\nParties:\n${websiteName} (Data Controller)\nGu Live Chat (Data Processor)\n\nScope:\nThis agreement governs the processing of personal data within Gu Live Chat services.\n\nData Categories:\n- Contact information (name, email, phone)\n- Chat messages and conversation history\n- Visitor session data\n- Technical data (IP address, browser info)\n\nPurpose:\nProviding customer support and communication services.\n\nRetention Periods:\n- Visitor data: ${visitorDataDays} days\n- Session data: ${sessionDataDays} days\n- Chat history: ${chatHistoryDays} days\n\nSignature:\nDate: ${date}`,
  },
  webhooks: {
    title: 'Webhooks',
    subtitle: 'Send real-time notifications to external systems',
    addWebhook: '+ Add webhook',
    newWebhook: 'New webhook',
    urlLabel: 'URL',
    urlPlaceholder: 'https://example.com/webhook',
    eventsLabel: 'Events',
    emptyTitle: 'No webhooks yet',
    emptyHint: 'Add a webhook to send real-time notifications to external systems',
    failureCount: (n) => `${n} failed attempt${n === 1 ? '' : 's'}`,
    test: 'Test',
    deactivate: 'Deactivate',
    activate: 'Activate',
    confirmDelete: 'Delete this webhook?',
    createFailed: 'Could not create webhook',
    securityTitle: 'Webhook security',
    securityDescBefore: 'Each webhook request is signed with your webhook secret. Use the ',
    securityDescAfter: ' header value to verify requests.',
    signatureHeader: 'X-Gu-Signature',
  },
  knowledge: {
    title: 'Knowledge Base',
    subtitle: 'Manage articles and categories',
    categories: 'Categories',
    newArticle: '+ New Article',
    categoriesTitle: 'Categories',
    categoriesSubtitle: 'Manage article categories',
    newCategory: '+ New Category',
    editCategory: 'Edit Category',
    name: 'Name',
    slug: 'Slug',
    description: 'Description',
    icon: 'Emoji / Icon',
    categoryNamePlaceholder: 'Category name',
    slugPlaceholder: 'category-slug',
    descriptionPlaceholder: 'Short description (optional)',
    iconPlaceholder: '📁 (optional)',
    nameSlugRequired: 'Name and slug are required',
    categoryUpdated: 'Category updated',
    categoryCreated: 'Category created',
    deleteCategoryConfirm: 'Delete this category? Articles in it will become uncategorized.',
    noCategories: 'No categories yet',
    noCategoriesHint: 'Create a category to organize your articles',
    deleteArticleConfirm: 'Are you sure you want to delete this article?',
    searchPlaceholder: 'Search articles...',
    status: 'Status',
    noArticles: 'No articles yet',
    noArticlesHint: 'Create your first knowledge base article',
    createArticle: 'Create Article',
    featured: 'Featured',
    newArticleTitle: 'New Article',
    editArticleTitle: 'Edit Article',
    titleLabel: 'Title',
    titlePlaceholder: 'Article title',
    slugArticlePlaceholder: 'article-slug',
    excerptLabel: 'Short Description',
    excerptPlaceholder: 'A short description (optional)',
    contentLabel: 'Content',
    contentPlaceholder: 'Write your article content here...',
    categoryLabel: 'Category',
    selectCategory: 'Select category',
    featuredArticle: 'Featured Article',
    saveDraft: 'Save Draft',
    publishing: 'Publishing...',
    publish: 'Publish',
    articleSaved: 'Article saved!',
    requiredFields: 'Title, slug, and content are required',
    previewTitle: 'Preview',
    statusDraft: 'Draft',
    statusPublished: 'Published',
    statusArchived: 'Archived',
  },
  tickets: {
    title: 'Ticket Management',
    subtitle: 'Manage customer requests',
    createTicket: '+ Create Ticket',
    searchPlaceholder: 'Search tickets (subject, email, name)...',
    noTickets: 'No tickets yet',
    noTicketsFiltered: 'No tickets in this status',
    noTicketsHint: 'Create a new ticket',
    colId: 'ID',
    colSubject: 'Subject',
    colStatus: 'Status',
    colPriority: 'Priority',
    colChannel: 'Channel',
    colAssignee: 'Assignee',
    colDate: 'Date',
    colMessages: 'Messages',
    previous: 'Previous',
    next: 'Next',
    newTitle: 'New Ticket',
    backToTickets: '← Tickets',
    subject: 'Subject *',
    subjectPlaceholder: 'Ticket subject',
    customerName: 'Customer Name',
    customerNamePlaceholder: 'Full name',
    customerEmail: 'Customer Email *',
    customerEmailPlaceholder: 'name@domain.com',
    channel: 'Channel',
    priority: 'Priority',
    description: 'Description',
    descriptionPlaceholder: 'Detailed description of the issue…',
    creating: 'Creating…',
    createFailed: 'Could not create ticket',
    notFound: 'Ticket not found',
    goBack: 'Go back',
    backToList: 'Back to Tickets',
    messages: 'Messages',
    noMessages: 'No messages yet',
    agent: 'Agent',
    internalNotes: (n) => `${n} internal note${n === 1 ? '' : 's'}`,
    internalNote: 'Note',
    internalNoteTag: '(internal note)',
    reply: 'Reply',
    replyPlaceholder: 'Write your reply...',
    internalNotePlaceholder: 'Add an internal note...',
    internalOnly: 'Visible to agents only',
    customerVisible: 'Will be sent to the customer',
    sendHint: 'Cmd/Ctrl+Enter',
    sending: 'Sending...',
    send: 'Send',
    addNote: 'Add Note',
    status: 'Status',
    assignee: 'Assigned Agent',
    unassigned: 'Unassigned',
    created: 'Created',
    firstResponse: 'First response',
    resolved: 'Resolved',
    closed: 'Closed',
    statusNew: 'New',
    statusOpen: 'Open',
    statusPendingCustomer: 'Awaiting Customer',
    statusPendingAgent: 'Awaiting Agent',
    statusOnHold: 'On Hold',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    channelEmail: 'Email',
    channelWidget: 'Widget',
    channelApi: 'API',
    channelWhatsapp: 'WhatsApp',
    channelMessenger: 'Messenger',
    channelInstagram: 'Instagram',
    channelImport: 'Import',
  },
  widget: {
    title: 'Widget Settings',
    subtitle: 'Customize your chat widget appearance and behavior',
    subtitleForSite: (name) => `Changes apply to the widget on ${name}.`,
    noSiteSelected: 'No site selected',
    selectSiteHint: 'Select a site to configure widget settings.',
    noActiveSite: 'No active website found',
    appearance: 'Appearance',
    primaryColor: 'Primary Color',
    position: 'Position',
    bottomRight: '↓ Bottom Right',
    bottomLeft: '↓ Bottom Left',
    messages: 'Messages',
    welcomeMessage: 'Welcome Message',
    offlineMessage: 'Offline Message',
    behavior: 'Behavior',
    preChatForm: 'Pre-chat form',
    preChatFormDesc: 'When off, visitors message directly. When on, choose optional fields.',
    requireName: 'Ask for name',
    requireNameDesc: 'Show name field on form (not required unless filled)',
    requireEmail: 'Ask for email',
    requireEmailDesc: 'Show email field on form (not required unless filled)',
    soundNotifications: 'Sound notifications',
    soundNotificationsDesc: 'Play sound for new messages on visitor side (coming soon)',
    autoOpen: 'Auto open',
    autoOpenDesc: 'Open widget automatically after page load (coming soon)',
    livePreview: 'Live Preview',
    online: 'Online',
    typeMessage: 'Type your message...',
    install: 'Widget Installation',
    installHint: (name) => `This code belongs to ${name} only.`,
    copied: '✓ Copied!',
    copy: 'Copy',
    defaultWelcome: 'Hello! How can we help you?',
    defaultOffline: 'We are offline. Leave a message and we will get back to you.',
  },
  billing: {
    title: 'Billing',
    subtitle: 'Manage your plan and view billing information',
    paymentSuccess: 'Payment completed! Your plan is being updated...',
    paymentFailed: 'Payment failed. Please try again.',
    paymentNotConfigured: 'Payment system is not configured yet. Contact your administrator.',
    paymentStartFailed: 'Could not start payment',
    cancelConfirm: 'Cancel your subscription? Your plan will revert to Free.',
    cancelSuccess: 'Subscription cancelled successfully.',
    cancelFailed: 'Cancellation failed',
    trialStarted: 'PRO trial started!',
    trialStartFailed: 'Could not start trial',
    statusActive: 'Active',
    statusPastDue: 'Payment Due',
    statusTrialEnded: 'Trial Ended',
    statusCanceled: 'Cancelled',
    statusTrialing: 'Trial',
    trialActive: 'PRO Plan Trial Active',
    trialDaysLeft: (days) => `${days} day${days === 1 ? '' : 's'} left in your trial`,
    trialBonusWidget: (days) => ` · +${days} days when widget is installed`,
    trialBonusChat: (days) => ` · +${days} days on first chat`,
    trialBillingTitle: (days) => `Try PRO Free for ${days} Days`,
    trialBillingSubtitle: (days, widgetBonus, chatBonus) =>
      `All PRO features for ${days} days. Enter your card to start; if a card is already on file or your account has an active balance, trial starts immediately. +${widgetBonus} days when the widget is installed, +${chatBonus} on first chat.`,
    trialCardHint: 'After the trial, PRO is charged to your saved card. Cancel anytime.',
    startTrial: 'Start Trial with Card',
    startingTrial: 'Starting…',
    currentPlan: 'Your Current Plan',
    freePlan: 'Free',
    basicFeatures: 'Basic features',
    renewalDate: (date) => `Renewal date: ${date}`,
    autoCharge: ' — charged automatically from your saved card',
    pastDueWarning: '⚠️ Payment failed. Please update your payment details.',
    perMonth: '/mo',
    cancelSubscription: 'Cancel Subscription',
    cancelling: 'Cancelling...',
    planUpgrade: 'Plan Upgrade',
    planUpgradeHint: 'Visit Plans to purchase a package — payments are processed securely via iyzico.',
    viewPlans: 'View Plans',
    enterprise: 'Enterprise',
    enterpriseTitle: 'Contact us for larger team deployments',
    enterpriseDesc: 'We offer custom integrations, white-label, tailored SLAs, and team training.',
    enterpriseFeatures: [
      'Custom onboarding program',
      'Tailored SLA',
      'Custom feature development',
      'Custom pricing',
      'Team training & consulting',
    ],
    contactUs: 'Contact Us',
    paymentDisabledTitle: 'Payment system not configured',
    paymentDisabledDesc: 'iyzico API credentials are missing. Contact your admin or configure iyzico in the .env file.',
    invoiceHistory: 'Invoice History',
    viewAll: 'View All →',
    noInvoices: 'No invoices yet',
    noInvoicesHint: 'Invoices will appear here when you upgrade to a paid plan',
    securePayment: 'Secure Payment — iyzico',
    securePaymentHint: '256-bit SSL · iyzico secure checkout',
  },
  invoices: {
    title: 'Invoice History',
    subtitle: (site) => `${site} invoices`,
    noInvoices: 'No invoices yet',
    noInvoicesHint: 'Invoices will appear here after you make a payment',
    colInvoice: 'Invoice',
    colPlan: 'Plan',
    colPeriod: 'Period',
    colAmount: 'Amount',
    colStatus: 'Status',
  },
  invoiceStatus: {
    PENDING: 'Pending',
    PAID: 'Paid',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  },
  addons: {
    title: 'Add-on Store',
    subtitle: 'Premium add-ons to power up your platform',
    searchPlaceholder: 'Search add-ons...',
    loading: 'Loading store...',
    activeCount: (n) => `${n} active`,
    myAddons: 'My Add-ons',
    featured: 'Featured Add-ons',
    popular: 'Popular',
    allAddons: 'All Add-ons',
    resultsFor: (query, count) => `${count} result${count === 1 ? '' : 's'} for "${query}"`,
    addonCount: (n) => `${n} add-on${n === 1 ? '' : 's'}`,
    notFound: 'No add-ons found',
    notFoundSearch: (query) => `No add-ons match "${query}". Try a different search term.`,
    notFoundCategory: 'No add-ons in this category yet. Try another category.',
    showAll: 'Show All',
    manage: 'Manage',
    disable: 'Disable',
    enable: 'Enable',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    purchasedActive: 'Purchased • Active',
    purchasedInactive: 'Purchased • Inactive',
    buyNow: 'Buy Now',
    buy: 'Buy',
    free: 'Free',
    perMonth: '/mo',
    perYear: '/yr',
    refundGuarantee: '14-day money-back guarantee',
    planUpgradeRequired: 'Plan upgrade or add-on purchase required',
    planIncluded: (plan) => `✓ Included in ${plan}`,
    planRequired: (plan) => `${plan}+`,
    purchaseFailed: 'Purchase failed',
    paymentStartFailed: 'Could not start payment',
    monthlyFee: 'Monthly Fee',
    proceedToPayment: 'Proceed to Payment',
    backToStore: 'Back to Store',
    addonNotFound: 'Add-on not found',
    addonNotFoundHint: 'This add-on does not exist or has been removed',
    status: 'Status',
    disabled: 'Disabled',
    purchasedAt: 'Purchased',
    expiresAt: 'Expires',
    autoRenew: 'Auto-renewal',
    autoRenewOn: 'On',
    autoRenewOff: 'Off',
    subscriptionCancelled: (date) => `Subscription cancelled — ${date}`,
    description: 'Description',
    setupGuide: 'Setup Guide',
    configuration: 'Configuration',
    selectOption: 'Select',
    permissions: 'Permissions',
    cancelSubscription: 'Cancel Subscription',
    cancelSubscriptionHint: 'You can keep using it until the end of the billing period',
    cancelSubscriptionBtn: 'Cancel Subscription',
    processing: 'Processing...',
    operationFailed: 'Operation failed',
    featuredBadge: 'Featured',
    categoryAll: 'All',
    categorySocial: 'Social',
    categoryMarketing: 'Marketing',
    categoryAi: 'AI',
    categoryAnalytics: 'Analytics',
    categoryCrm: 'CRM',
    categorySupport: 'Support',
    categoryAutomation: 'Automation',
    categoryEcommerce: 'E-commerce',
    categoryCustom: 'Custom',
    categorySecurity: 'Security',
    planFree: 'Free',
    planStarter: 'Starter',
    planPro: 'Professional',
    planBusiness: 'Business',
    cancelConfirm: 'Cancel your subscription? The add-on will be disabled at the end of the period.',
  },
  statusPage: {
    title: 'Status Page',
    subtitle: 'Share your system status with customers',
    preview: 'Preview',
    saved: '✓ Saved',
    saving: 'Saving...',
    pageSettings: 'Page Settings',
    pageTitle: 'Title',
    subdomain: 'Subdomain',
    subdomainSuffix: '.gulivechat.com',
    description: 'Description',
    logoUrl: 'Logo URL',
    twitterHandle: 'Twitter Handle',
    primaryColor: 'Primary Color',
    active: 'Active',
    showHistory: 'Show History',
    components: 'Components',
    componentNamePlaceholder: 'Component name',
    add: 'Add',
    noComponents: 'No components yet. Save the status page first.',
    incidents: 'Incidents',
    reportIncident: '+ Report Incident',
    incidentTitlePlaceholder: 'Incident title',
    incidentMessagePlaceholder: 'Incident description',
    create: 'Create',
    noIncidents: 'No incidents reported yet.',
    compOperational: 'Operational',
    compDegraded: 'Degraded Performance',
    compPartialOutage: 'Partial Outage',
    compMajorOutage: 'Major Outage',
    compMaintenance: 'Under Maintenance',
    incInvestigating: 'Investigating',
    incIdentified: 'Identified',
    incMonitoring: 'Monitoring',
    incResolved: 'Resolved',
    severityLow: 'Low',
    severityMedium: 'Medium',
    severityHigh: 'High',
    severityUrgent: 'Urgent',
  },
  workflowTriggers: {
    CONVERSATION_CREATED: 'Conversation Created',
    CONVERSATION_RESOLVED: 'Conversation Resolved',
    CONVERSATION_CLOSED: 'Conversation Closed',
    MESSAGE_RECEIVED: 'Message Received',
    VISITOR_CREATED: 'Visitor Created',
    VISITOR_SEEN_PAGE: 'Page Viewed',
    TICKET_CREATED: 'Ticket Created',
    TICKET_UPDATED: 'Ticket Updated',
    SCHEDULED: 'Scheduled',
    WEBHOOK_RECEIVED: 'Webhook Received',
  },
  workflowActions: {
    SEND_MESSAGE: 'Send Message',
    SEND_EMAIL: 'Send Email',
    ASSIGN_AGENT: 'Assign Agent',
    CHANGE_STATUS: 'Change Status',
    SET_PRIORITY: 'Set Priority',
    ADD_TAG: 'Add Tag',
    REMOVE_TAG: 'Remove Tag',
    FORWARD_TO_WEBHOOK: 'Forward to Webhook',
    ADD_NOTE: 'Add Note',
    TRIGGER_CHATBOT: 'Trigger Chatbot',
    SEND_NOTIFICATION: 'Send Notification',
    DELAY: 'Delay',
    CONDITIONAL_BRANCH: 'Conditional Branch',
  },
  workflows: {
    title: 'Automations',
    subtitle: 'Automate repetitive tasks',
    createWorkflow: '+ Create Workflow',
    editWorkflow: 'Edit Workflow',
    newWorkflow: 'New Workflow',
    workflowName: 'Workflow Name',
    workflowNamePlaceholder: 'Workflow name',
    descriptionPlaceholder: 'Description',
    confirmDelete: 'Are you sure you want to delete this workflow?',
    emptyTitle: 'No workflows yet',
    emptyHint: 'Create your first automation',
  },
  chatbot: {
    title: 'Chatbot',
    subtitle: 'Build automated reply flows',
    newChatbot: '+ New Chatbot',
    botName: 'Chatbot Name',
    botNamePlaceholder: 'e.g. Welcome Bot',
    keywords: 'Keywords',
    keywordsPlaceholder: 'pricing, order, support (comma-separated)',
    flowSteps: 'Flow Steps',
    messagePlaceholder: 'Message text...',
    transferPlaceholder: 'Transfer message...',
    promptPlaceholder: 'Prompt message...',
    optionText: 'Option text',
    addOption: '+ Add Option',
    createChatbot: 'Create Chatbot',
    createFailed: 'Could not create chatbot',
    confirmDelete: 'Are you sure you want to delete this chatbot?',
    deleteFailed: 'Could not delete chatbot',
    emptyTitle: 'No chatbots yet',
    emptyHint: 'Use the button above to create your first chatbot',
    stepCount: (n) => `${n} step${n === 1 ? '' : 's'}`,
    defaultWelcome: 'Hello! How can we help you?',
    dragToReorder: 'Drag to reorder',
    dropHere: 'Drop here',
    addStep: 'Add Step',
    stepTypes: {
      MESSAGE: { label: 'Message', description: 'Send a text message' },
      CHOICE: { label: 'Choice', description: 'Offer clickable options' },
      COLLECT_EMAIL: { label: 'Collect Email', description: 'Ask the visitor for email' },
      COLLECT_NAME: { label: 'Collect Name', description: 'Ask the visitor for name' },
      ASSIGN_AGENT: { label: 'Transfer to Agent', description: 'Hand off chat to an agent' },
      END: { label: 'End', description: 'End the conversation' },
    },
    triggers: {
      ALL_CONVERSATIONS: 'All conversations',
      OFFLINE_ONLY: 'Offline only',
      KEYWORD: 'When keyword is triggered',
      FIRST_VISIT: 'On first visit',
    },
  },
  aiBot: {
    title: 'AI Chat Assistant',
    subtitle: 'Natural chat with GPT, Gemini, Claude, Groq, OpenRouter (free Llama/Gemma), or Ollama.',
    selectSiteFirst: 'Select a site first.',
    providersTitle: 'AI Providers',
    ready: 'Ready',
    noKey: 'No key',
    aiModeActive: '✓ Real AI mode active — you can have smart conversations with visitors.',
    freeTierHint:
      'For free open source: OPENROUTER_API_KEY (openrouter.ai) or GEMINI_API_KEY. Self-hosted: OLLAMA_BASE_URL. Without a key, only simple FAQ replies are provided.',
    enableAssistant: 'Enable AI assistant',
    enableAssistantHint: 'Enables AI on widget, WhatsApp, and all channels.',
    autoReply: 'Automatic chat reply',
    autoReplyHint: 'Instant smart reply to visitor messages. Stops when an agent is assigned.',
    autoSuggest: 'Reply suggestions for agents',
    autoSuggestHint: 'AI draft replies in the inbox.',
    provider: 'Provider',
    model: 'Model',
    creativity: (value) => `Creativity (${value})`,
    apiKey: 'API Key (optional)',
    apiKeyPlaceholderSaved: '•••••••• (saved)',
    apiKeyPlaceholder: 'Site-specific key — leave blank to use server key',
    systemPrompt: 'Personality / System Prompt',
    systemPromptPlaceholder:
      'e.g. You are a sales advisor for brand X. Be friendly, recommend products, explain packages when asked about pricing...',
    liveTest: 'Live Test',
    defaultTestMessage: 'Hello, can I get information about your pricing?',
    askAi: 'Ask AI',
    gettingReply: 'Getting reply...',
    saveSuccess: 'AI assistant settings saved.',
    saveFailed: 'Could not save settings',
    testFailed: 'Test failed',
    testModeLlm: 'Real AI (LLM)',
    testModeFallback: 'Fallback mode (knowledge base)',
    planModelsTitle: 'Models included in your plan',
    planModelsHint: (label) => `Your current plan: ${label}. Upgrade for more powerful models.`,
    modelLocked: ' — upgrade required',
    platformFallbackHint:
      'All providers run via the platform Gemini key. Add your own OpenAI/Groq keys to use those providers directly.',
    providers: {
      OPENAI: 'OpenAI (GPT)',
      ANTHROPIC: 'Anthropic (Claude)',
      GEMINI: 'Google Gemini',
      GROQ: 'Groq (Llama — open source)',
      OPENROUTER: 'OpenRouter (free open-source models)',
      OLLAMA: 'Ollama (your server — fully open source)',
    },
  },
  channels: {
    title: 'Channels',
    subtitle: 'Manage multi-channel communication integrations',
    connected: 'Connected',
    notConnected: 'Not Connected',
    configure: 'Configure',
    configTitle: (label) => `${label} Configuration`,
    addFailed: 'Could not add channel',
    channelDefs: {
      WHATSAPP: { label: 'WhatsApp', description: 'WhatsApp Business API integration' },
      EMAIL: { label: 'Email', description: 'Email channel (SMTP/IMAP)' },
      MESSENGER: { label: 'Facebook Messenger', description: 'Facebook Messenger integration' },
      INSTAGRAM: { label: 'Instagram', description: 'Instagram DM integration' },
      TELEGRAM: { label: 'Telegram', description: 'Telegram Bot integration' },
      SLACK: { label: 'Slack', description: 'Slack integration' },
      SMS: { label: 'SMS', description: 'Twilio SMS integration' },
    },
    configFields: {
      WHATSAPP: [
        { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', placeholder: 'WhatsApp Business Phone ID' },
        { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'WhatsApp Access Token' },
      ],
      EMAIL: [
        { key: 'smtpHost', label: 'SMTP Server', type: 'text', placeholder: 'smtp.example.com' },
        { key: 'smtpPort', label: 'SMTP Port', type: 'text', placeholder: '587' },
        { key: 'smtpUser', label: 'SMTP User', type: 'text', placeholder: 'user@example.com' },
        { key: 'smtpPass', label: 'SMTP Password', type: 'password', placeholder: 'SMTP password' },
      ],
      MESSENGER: [
        { key: 'pageId', label: 'Page ID', type: 'text', placeholder: 'Facebook Page ID' },
        { key: 'pageAccessToken', label: 'Page Access Token', type: 'password', placeholder: 'Page Access Token' },
      ],
      INSTAGRAM: [
        { key: 'businessAccountId', label: 'Business Account ID', type: 'text', placeholder: 'Instagram Business Account ID' },
        { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Instagram Access Token' },
      ],
      TELEGRAM: [
        { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'Telegram Bot Token' },
      ],
      SLACK: [
        { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' },
        { key: 'signingSecret', label: 'Signing Secret', type: 'password', placeholder: 'Signing Secret' },
      ],
      SMS: [
        { key: 'accountSid', label: 'Twilio Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxx' },
        { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Twilio Auth Token' },
        { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+1234567890' },
      ],
    },
  },
  proactive: {
    title: 'Proactive Messages',
    subtitle: 'Show automatic messages to visitors based on triggers',
    addMessage: 'Add Message',
    editMessage: 'Edit Message',
    newMessage: 'New Proactive Message',
    titleLabel: 'Title',
    titlePlaceholder: 'Message title',
    messageLabel: 'Message',
    messagePlaceholder: 'Message content',
    triggerType: 'Trigger Type',
    triggerValue: 'Trigger Value',
    targetPages: 'Target Pages (JSON array or *, all pages if empty)',
    targetPagesPlaceholder: '["/pricing", "/contact"] or *',
    delaySeconds: 'Delay (seconds)',
    showOnce: 'Show once',
    confirmDelete: 'Are you sure you want to delete this proactive message?',
    emptyTitle: 'No proactive messages yet',
    emptyHint: 'Use the button above to create a new message',
    valueLabel: (value) => `Value: ${value}`,
    delayLabel: (seconds) => `Delay: ${seconds}s`,
    showOnceBadge: 'Once',
    showEveryTime: 'Every time',
    pagesLabel: (pages) => `Pages: ${pages}`,
    disable: 'Disable',
    enable: 'Enable',
    edit: 'Edit',
    triggers: {
      TIME_ON_PAGE: 'Time on Page',
      SCROLL_DEPTH: 'Scroll Depth',
      EXIT_INTENT: 'Exit Intent',
      PAGE_VISIT: 'Page Visit',
      CUSTOM: 'Custom',
    },
    triggerPlaceholders: {
      TIME_ON_PAGE: 'Seconds (e.g. 30)',
      SCROLL_DEPTH: 'Percent (e.g. 50)',
      EXIT_INTENT: '-',
      PAGE_VISIT: 'URL (e.g. /pricing)',
      CUSTOM: 'Value',
    },
  },
  campaigns: {
    title: 'Campaigns',
    subtitle: 'Manage email and notification campaigns',
    createCampaign: '+ Create Campaign',
    newCampaign: 'New Campaign',
    campaignName: 'Campaign Name',
    campaignNamePlaceholder: 'Campaign name',
    type: 'Type',
    descriptionPlaceholder: 'Campaign description',
    subject: 'Subject',
    subjectPlaceholder: 'Email subject',
    content: 'Content',
    contentPlaceholder: 'Campaign content',
    scheduledAt: 'Scheduled Date',
    confirmDelete: 'Are you sure you want to delete this campaign?',
    confirmSend: 'Are you sure you want to send this campaign now?',
    sendFailed: 'Could not send campaign',
    sentSuccess: (count) => `Campaign sent: ${count} recipient${count === 1 ? '' : 's'}`,
    emptyTitle: 'No campaigns yet',
    emptyHint: 'Create your first campaign',
    tableCampaign: 'Campaign',
    tableStatus: 'Status',
    tableSent: 'Sent',
    tableOpens: 'Opens',
    tableClicks: 'Clicks',
    tableReplies: 'Replies',
    tableActions: 'Actions',
    abTest: 'A/B Test',
    abTestHint: 'Compare two subject and content variants',
    variantA: 'Variant A',
    variantB: 'Variant B',
    abSplitPercent: 'Variant A split (%)',
    abSplitHint: 'Remaining recipients receive variant B',
    abBadge: 'A/B',
    tableAbResults: 'A/B Results',
    activate: 'Activate',
    send: 'Send',
    sending: 'Sending...',
    pause: 'Pause',
    resume: 'Resume',
    statuses: {
      DRAFT: 'Draft',
      ACTIVE: 'Active',
      PAUSED: 'Paused',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    },
    types: {
      EMAIL: 'Email',
      IN_APP: 'In-App',
      BROADCAST: 'Broadcast',
    },
  },
}

export function getSettingsMessages(locale: SiteLocale): SettingsMessages {
  return locale === 'en' ? en : tr
}

export function settingsDateLocale(locale: SiteLocale): string {
  return locale === 'en' ? 'en-US' : 'tr-TR'
}

export function ticketStatusLabels(s: SettingsMessages): Record<string, string> {
  const t = s.tickets
  return {
    NEW: t.statusNew,
    OPEN: t.statusOpen,
    PENDING_CUSTOMER: t.statusPendingCustomer,
    PENDING_AGENT: t.statusPendingAgent,
    ON_HOLD: t.statusOnHold,
    RESOLVED: t.statusResolved,
    CLOSED: t.statusClosed,
  }
}

export function ticketPriorityLabels(s: SettingsMessages): Record<string, string> {
  const t = s.tickets
  return {
    LOW: t.priorityLow,
    MEDIUM: t.priorityMedium,
    HIGH: t.priorityHigh,
    URGENT: t.priorityUrgent,
  }
}

export function ticketChannelLabels(s: SettingsMessages): Record<string, string> {
  const t = s.tickets
  return {
    EMAIL: t.channelEmail,
    WIDGET: t.channelWidget,
    API: t.channelApi,
    WHATSAPP: t.channelWhatsapp,
    MESSENGER: t.channelMessenger,
    INSTAGRAM: t.channelInstagram,
    IMPORT: t.channelImport,
  }
}

export function knowledgeStatusLabels(s: SettingsMessages): Record<string, string> {
  const k = s.knowledge
  return {
    DRAFT: k.statusDraft,
    PUBLISHED: k.statusPublished,
    ARCHIVED: k.statusArchived,
  }
}

export function addonCategoryLabels(s: SettingsMessages): Record<string, string> {
  const a = s.addons
  return {
    ALL: a.categoryAll,
    SOCIAL: a.categorySocial,
    MARKETING: a.categoryMarketing,
    AI: a.categoryAi,
    ANALYTICS: a.categoryAnalytics,
    CRM: a.categoryCrm,
    SUPPORT: a.categorySupport,
    AUTOMATION: a.categoryAutomation,
    ECOMMERCE: a.categoryEcommerce,
    CUSTOM: a.categoryCustom,
    SECURITY: a.categorySecurity,
  }
}

export function addonPlanBadges(s: SettingsMessages): Record<string, { label: string; className: string }> {
  const a = s.addons
  return {
    FREE: { label: a.planFree, className: 'bg-gray-500/10 text-gray-600' },
    STARTER: { label: a.planStarter, className: 'bg-blue-500/10 text-blue-600' },
    PRO: { label: a.planPro, className: 'bg-purple-500/10 text-purple-600' },
    BUSINESS: { label: a.planBusiness, className: 'bg-amber-500/10 text-amber-600' },
  }
}

export function statusPageComponentStatuses(s: SettingsMessages) {
  const sp = s.statusPage
  return [
    { value: 'OPERATIONAL', label: sp.compOperational, color: 'text-success' },
    { value: 'DEGRADED_PERFORMANCE', label: sp.compDegraded, color: 'text-warning' },
    { value: 'PARTIAL_OUTAGE', label: sp.compPartialOutage, color: 'text-orange-500' },
    { value: 'MAJOR_OUTAGE', label: sp.compMajorOutage, color: 'text-destructive' },
    { value: 'UNDER_MAINTENANCE', label: sp.compMaintenance, color: 'text-muted-foreground' },
  ]
}

export function statusPageIncidentStatuses(s: SettingsMessages) {
  const sp = s.statusPage
  return [
    { value: 'INVESTIGATING', label: sp.incInvestigating },
    { value: 'IDENTIFIED', label: sp.incIdentified },
    { value: 'MONITORING', label: sp.incMonitoring },
    { value: 'RESOLVED', label: sp.incResolved },
  ]
}

export function getInvoiceStatusLabelFromSettings(status: string, locale?: SiteLocale): string {
  const labels = getSettingsMessages(locale ?? 'tr').invoiceStatus
  return labels[status as keyof typeof labels] ?? status
}
