import { trialFreeTierFaqLine } from '@/lib/trial-config'
import type { MarketingPages } from './types'

export const marketingTr: MarketingPages = {
  common: {
    legal: 'Yasal',
    corporate: 'Kurumsal',
    security: 'Güvenlik',
    startFree: 'Ücretsiz Başla',
    seePricing: 'Fiyatlari Gör',
    readMore: 'Devamını oku',
    buyNow: 'Satın Al',
    active: 'Aktif',
    addon: 'Eklenti',
    popular: 'Popüler',
    detail: 'Detay',
    seeDetails: 'Detayları gör',
    customIntegration: 'Özel entegrasyon talebi',
    freeLabel: 'Ücretsiz',
    perMonth: '/ay',
    productDetails: 'Ürün detayları',
    getQuote: 'Teklif Al',
    notFoundHelp: 'Aradığınızı bulamadınız mı?',
    contactSupport: 'Destek Ekibine Yaz',
    menuAria: 'Navigasyon menusunu aç veya kapat',
  },
  seoChrome: {
    homeCrumb: 'Ana Sayfa',
    seePricing: 'Fiyatlari Gör',
    faqTitle: 'Sık Sorulan Sorular',
    tryFreeTitle: 'Hemen ücretsiz deneyin',
    tryFreeDesc: (trial: string) =>
      `Gu Live Chat ile müşterilerinize anında ulaşın. Kurulum 30 saniye, ${trial}.`,
    tryFreeCta: 'Ücretsiz Başla',
    relatedTitle: 'İlgili Sayfalar',
  },
  features: {
    badge: 'Özellikler',
    title: 'Müşteri hizmetleri ıçin tek çözüm',
    subtitle: 'Çok kanallı destek, AI Agent ve birleşik inbox - Gu Live Chat ile hepsi tek platformda.',
    ctaTitle: '{trial} — hemen başlayın',
    ctaNote: 'Kredi kartı gerekmez - Kurulum 30 saniye',
    items: [
      {
        id: 'ai-agent',
        title: 'AI Agent',
        desc: 'Standart talepleri anında ışleyin. Bilgi bankası + LLM ile otomatik yanıt; temsilci atanınca devreye girer.',
      },
      {
        id: 'widget',
        title: 'Canlı Sohbet Widget',
        desc: 'WebSocket tabanlı anlık mesajlaşma, dosya paylaşımı, çeviri ve yazıyor göstergesi.',
      },
      {
        id: 'translate',
        title: 'Canlı Çeviri (PRO)',
        desc: '50+ dilde çift yönlü anlık çeviri. Temsilci ve ziyaretçı farklı dillerde sorunsuz konuşur; admin panelde ücretsiz.',
      },
      {
        id: 'inbox',
        title: 'Birleşik Gelen Kutusu',
        desc: 'Widget, WhatsApp, Instagram, Telegram, Messenger ve e-posta - tek panel, kanal rozeti ve filtre.',
      },
      {
        title: 'AI Sohbet ve Chatbot',
        desc: 'GPT/Gemini ile insan gibi yanıt (Profesyonel+). Görsel chatbot akışları, SSS ve workflow - alt paketlerde eklenti olarak.',
      },
      {
        title: 'YZ Yazım Yardımcısı',
        desc: 'Temsilcilere AI öneri ile daha hızlı ve etkili mesajlar yazma desteği.',
      },
      {
        title: 'Çoklu Kanal (PRO)',
        desc: 'WhatsApp Business, Instagram DM, Facebook Messenger, Telegram ve e-posta entegrasyonu.',
      },
      {
        title: 'Gu Pazarlama',
        desc: 'Kampanyalar, hedefli mesajlar ve proaktif sohbet ile trafiğı müşteriye dönüştürün.',
      },
      {
        id: 'crm',
        title: 'Kişiler ve Ziyaretçı CRM',
        desc: 'Profil, sohbet geçmışı, etiketler ve canlı ziyaretçı takibi. Veriler güvenli platformda.',
      },
      {
        title: 'Video ve Ekran Izleme',
        desc: 'Ziyaretçı ekranını canlı izleyin, görüntülü destek ile ürünlerinizi gösterin (PRO).',
      },
      {
        title: 'Telefon ve SMS',
        desc: 'Twilio SMS entegrasyonu ile otomatik SMS bildirimleri (Profesyonel paket ve üzeri).',
      },
      {
        title: 'Bilgi Bankası',
        desc: 'SSS ve makaleler - AI Agent ve chatbot ıçin bağlam kaynağı.',
      },
      {
        title: 'Workflow Otomasyonu',
        desc: 'Tetikleyici ve aksiyon tabanlı otomatik yanıt akışları.',
      },
      {
        id: 'analytics',
        title: 'Analitik ve Performans',
        desc: 'Kanal dağılımı, temsilci sıralaması, yanıt süresi ve AI çözüm oranı.',
      },
      {
        title: 'API ve Entegrasyonlar',
        desc: 'REST API, webhook ve hazır entegrasyonlar. CRM ve özel yazılımlara bağlanın.',
      },
      {
        title: 'Güvenlik',
        desc: 'SSL/TLS, KVKK, rol tabanlı erişim. Iş hesap şifrelerini paylaşmadan güvenli destek.',
      },
      {
        title: 'Hızlı Kurulum',
        desc: 'Tek satır embed kodu - 30 saniyede sitenize entegre edin.',
      },
    ],
  },
  integrations: {
    badge: 'Entegrasyonlar',
    title: 'Mevcut araçlarınızla bağlantı kurun',
    subtitle:
      'Gu Live Chat; mesajlaşma kanalları, otomasyon araçları ve tüm büyük e-ticaret platformlarıyla sorunsuz çalışır. Kurulum çoğu platformda 30 saniyeden kısa sürer.',
    messagingTitle: 'Mesajlaşma Kanalları',
    messagingSubtitle: 'Tüm kanalları tek gelen kutusunda birleştirin.',
    automationTitle: 'Otomasyon ve API',
    automationSubtitle: 'Webhook, REST API ve no-code otomasyon araçları.',
    ecommerceTitle: 'E-ticaret Platformları',
    ecommerceSubtitle: "Widget snippet'ı ile tüm mağaza altyapılarında çalışır - ek geliştirme gerekmez.",
    ctaTitle: 'Kuruluma hazır mısınız?',
    ctaSubtitle: 'Ücretsiz hesap oluşturun, widget kodunu sitenize yapıştırın ve kanalları panelden bağlayın.',
    customIntegration: 'Özel entegrasyon talebi',
    messaging: [
      {
        name: 'Canlı Sohbet Widget',
        desc: 'Web sitenize tek satır kod ile canlı destek. Tüm platformlarda çalışır.',
        status: 'active',
        href: '/canlı-destek',
      },
      {
        name: 'WhatsApp Business',
        desc: "WhatsApp mesajlarını birleşik inbox'ta yönetin.",
        status: 'addon',
        href: '/whatsapp-destek',
      },
      {
        name: 'Facebook Messenger',
        desc: 'Meta Messenger mesajlarını tek panelden yanıtlayın.',
        status: 'active',
      },
      {
        name: 'Instagram DM',
        desc: "Instagram Direct mesajlarını inbox'a aktarın.",
        status: 'active',
      },
      {
        name: 'Telegram',
        desc: 'Telegram bot ile gelen mesajları canlı destek ekibine yönlendirin.',
        status: 'active',
      },
      {
        name: 'E-posta Kanalı',
        desc: "Gelen e-postaları inbox'a aktarın, yanıtları e-posta olarak gönderin.",
        status: 'active',
      },
      {
        name: 'SMS (Twilio)',
        desc: 'SMS bildirimleri ve iki yönlü mesajlaşma.',
        status: 'active',
      },
      {
        name: 'Slack',
        desc: 'Yeni sohbet ve mesaj bildirimlerini Slack kanalınıza gönderin.',
        status: 'active',
      },
    ],
    automation: [
      {
        name: 'Webhook ve REST API',
        desc: 'conversation.created, message.sent ve daha fazlası. Kendi sistemlerinize bağlanın.',
        status: 'active',
      },
      {
        name: 'Zapier ve Make',
        desc: 'Webhook olayları ile 5000+ uygulamaya kodsuz otomasyon.',
        status: 'active',
      },
      {
        name: 'Workflow Otomasyonu',
        desc: 'Tetikleyici ve aksiyon tabanlı otomatik yanıt akisleri.',
        status: 'active',
      },
      {
        name: 'E-ticaret Takibi',
        desc: 'Sepet, sayfa görüntüleme ve dönüşüm olaylarını izleyin.',
        status: 'addon',
        href: '/apps',
      },
    ],
    ecommerce: [
      { name: 'Shopify', desc: "Shopify mağazanıza widget ekleyin; sipariş ve sepet takibi.", status: 'active' },
      { name: 'WooCommerce', desc: "WordPress WooCommerce sitelerinde canlı destek ve chatbot.", status: 'active' },
      { name: 'IdeaSoft', desc: "Türkiye'nın popüler e-ticaret altyapısına tek tık widget kurulumu.", status: 'active' },
      { name: 'Ticimax', desc: 'Ticimax mağazalarında ziyaretçı takibi ve proaktif mesajlar.', status: 'active' },
      { name: 'ikas', desc: 'ikas e-ticaret sitelerinde canlı sohbet ve AI destek.', status: 'active' },
      { name: 'T-Soft', desc: 'T-Soft altyapılı mağazalarda birleşik müşteri desteği.', status: 'active' },
      { name: 'Magento', desc: 'Magento / Adobe Commerce mağazalarına entegre canlı destek.', status: 'active' },
      { name: 'OpenCart', desc: 'OpenCart sitelerinde widget ile anında destek.', status: 'active' },
      { name: 'PrestaShop', desc: 'PrestaShop mağazalarında çok dilli canlı destek.', status: 'active' },
      { name: 'Wix eCommerce', desc: 'Wix online mağazalarına kolay widget entegrasyonu.', status: 'active' },
      { name: 'BigCommerce', desc: 'BigCommerce mağazalarında ziyaretçı ve sepet takibi.', status: 'active' },
      { name: 'NopCommerce', desc: 'NopCommerce (.NET) e-ticaret sitelerinde canlı sohbet.', status: 'active' },
      { name: 'PlatinMarket', desc: 'PlatinMarket altyapılı mağazalarda müşteri hizmetleri.', status: 'active' },
      { name: 'Projesoft', desc: 'Projesoft e-ticaret sitelerine hızlı widget kurulumu.', status: 'active' },
      { name: 'WordPress', desc: 'Herhangi bir WordPress sitesine eklenti veya snippet ile ekleyin.', status: 'active' },
      { name: 'Özel / Headless', desc: 'React, Next.js, Vue ve özel API tabanlı mağazalar.', status: 'active' },
    ],
  },
  ai: {
    badge: 'Yapay Zeka',
    title: 'Akıllı destek, gerçek sonuçlar',
    subtitle:
      'Gu Live Chat AI asistanı tekrarlayan soruları otomatik yanıtlar, ekibinize zaman kazandırır ve müşterilerinize 7/24 kesintisiz destek sunar.',
    howTitle: 'Nasıl başlanır?',
    howSubtitle: '4 adımda AI asistanınızı devreye alın',
    steps: [
      'Bilgi bankanızı oluşturun veya mevcut makaleleri ıçe aktarın',
      'Chatbot akışlarını görsel editörde tanımlayın',
      'AI asistanı etkinleştirin ve test edin',
      'Performansı analitik panelden takip edin',
    ],
    stats: ['%40 daha az tekrarlayan soru', '7/24 otomatik yanıt', 'Tek tıkla temsilciye devret'],
    ctaTitle: 'AI asistanını deneyin',
    ctaSubtitle: 'Profesyonel planda AI özellikleri dahildir.',
    capabilities: [
      {
        title: 'Bağlama duyarlı yanıtlar',
        desc: 'Müşterinin sorusunu anlayarak bilgi bankasından en uygun cevabı sunar.',
      },
      {
        title: 'Bilgi bankası entegrasyonu',
        desc: "Makalelerinizi AI'a öğretin, güncel bilgilerle yanıt verin.",
      },
      {
        title: 'Akıllı eskalasyon',
        desc: 'Karmaşık talepleri otomatik olarak canlı temsilciye aktarır.',
      },
      {
        title: 'Öneri sistemi',
        desc: 'Temsilcilere yanıt önerileri sunarak yanıt süresini kısaltır.',
      },
    ],
  },
  contact: {
    badge: 'Iletişim',
    title: 'Bize ulaşın',
    subtitle: 'Sorularınız, demo talepleri veya kurumsal çözümler ıçin ekibimizle iletişime geçin.',
    email: 'E-posta',
    emailNote: '24 saat ıçinde yanıt',
    liveChat: 'Canlı Destek',
    liveChatNote: 'Site üzerinden',
    liveChatAction: 'Sohbeti aç',
    enterprise: 'Kurumsal',
    enterpriseNote: 'Özel fiyatlandırma ve SLA',
    enterpriseAction: 'Teklif iste',
    corporateInfo: 'Kurumsal bilgiler',
    helpCenter: 'Yardım merkezi',
    formTitle: 'Mesaj gönderin',
    formSubtitle: 'Demo, kurumsal teklif veya teknik destek ıçin formu doldurun.',
    nameLabel: 'Ad Soyad',
    namePlaceholder: 'Adınız Soyadınız',
    emailLabel: 'E-posta',
    emailPlaceholder: 'ornek@şirket.com',
    subjectLabel: 'Konu',
    messageLabel: 'Mesaj',
    messagePlaceholder: 'Size nasıl yardımcı olabiliriz?',
    submit: 'Gönder',
    submitting: 'Gönderiliyor...',
    privacyNote: 'Göndererek gizlilik sözleşmesini kabul etmiş olursunuz.',
    privacyLink: 'gizlilik sözleşmesi',
    subjects: {
      demo: 'Demo Talebi',
      general: 'Genel Bilgi',
      enterprise: 'Kurumsal Çözüm',
      support: 'Teknik Destek',
    },
    toastSuccessTitle: 'Mesajınız alındı',
    toastSuccessDesc: 'En kısa sürede size dönüş yapacağız.',
    toastErrorTitle: 'Gönderilemedi',
    toastLiveChatTitle: 'Canlı destek',
    toastLiveChatDesc: 'Sağ alttaki sohbet balonunu kullanarak bize ulaşabilirsiniz.',
    sendError: 'Bir hata oluştu',
  },
  help: {
    badge: 'Yardım',
    title: 'Yardım Merkezi',
    subtitle: 'Kurulum, kullanım ve sorun giderme rehberleri.',
    notFound: 'Aradığınızı bulamadınız mı?',
    contactCta: 'Destek Ekibine Yaz',
    categories: [
      {
        title: 'Başlangıç',
        articles: [
          {
            q: "Gu Live Chat'ı nasıl kurarım?",
            a: "Kayıt olduktan sonra Ayarlar > Widget bölümünden embed kodunu kopyalayıp sitenize yapıştırın.",
          },
          {
            q: "Widget'ı nasıl özelleştiririm?",
            a: "Renk, pozisyon, karşılama mesajı ve avatar ayarlarını dashboard'dan değıştirebilirsiniz.",
          },
          {
            q: 'Takım üyesi nasıl eklerim?',
            a: "Ayarlar > Takım bölümünden e-posta ile davet gönderin.",
          },
        ],
      },
      {
        title: 'Sohbet ve Inbox',
        articles: [
          {
            q: 'Hazır cevaplar nasıl kullanılır?',
            a: "Inbox'ta '/' yazarak hazır cevaplarınıza erisebilirsiniz.",
          },
          {
            q: 'Sohbet nasıl atanır?',
            a: 'Sohbet detayında sağ üstten temsilci seçerek atama yapabilirsiniz.',
          },
          {
            q: 'Dosya gönderimi destekleniyor mü?',
            a: 'Evet, görsel ve belge dosyaları gönderebilirsiniz (plan limitlerine tabi).',
          },
        ],
      },
      {
        title: 'Otomasyon ve Entegrasyon',
        articles: [
          {
            q: 'Webhook nasıl kurulur?',
            a: "Ayarlar > Webhook'lar bölümünden URL ve event seçerek webhook oluşturun.",
          },
          {
            q: 'Chatbot nasıl çalışır?',
            a: "Ayarlar > Chatbot bölümünden görsel editör ile adımlar oluşturun.",
          },
          {
            q: 'API dokümantasyonu nerede?',
            a: 'Profesyonel ve üzeri planlarda REST API erişimi mevcuttur. destek@gulivechat.com adresinden talep edin.',
          },
        ],
      },
    ],
  },
  apps: {
    badge: 'Apps',
    title: 'Eklenti mağazası',
    subtitle:
      "Gu Live Chat'ı ihtiyacınıza göre genişletin. Tüm eklentiler aylık dijital abonelik olarak satılır; ödeme iyzico güvenli ödeme altyapısı ile alınır.",
    catalogLink: 'Tüm ürün kataloğunu gör',
    customAddon: 'Özel eklenti geliştirmek ister mısınız?',
    contactCta: 'Iletişime Geç',
    items: [
      {
        name: 'WhatsApp Kanalı',
        desc: "WhatsApp Business mesajlarını inbox'a aktarın.",
        price: '₺149/ay',
        status: 'Aktif',
      },
      {
        name: 'AI Asistan Pro',
        desc: 'Gelişmış bağlam analizi ve çok dilli yanıtlar.',
        price: '₺299/ay',
        status: 'Popüler',
      },
      {
        name: 'Beyaz Etiket',
        desc: 'Kendi markanız, alan adınız ve renkleriniz.',
        price: '₺199/ay',
        status: 'Aktif',
      },
      {
        name: 'Gelişmış Analitik',
        desc: 'Özel raporlar, CSV export ve API erişimi.',
        price: '₺79/ay',
        status: 'Aktif',
      },
      {
        name: 'E-posta Pro',
        desc: 'Gelen kutusu senkronizasyonu ve otomatik yanıtlar.',
        price: '₺99/ay',
        status: 'Aktif',
      },
      {
        name: 'Zapier Bağlantısı',
        desc: '5000+ uygulamaya kodsuz entegrasyon.',
        price: '₺49/ay',
        status: 'Aktif',
      },
    ],
  },
  blog: {
    badge: 'Blog',
    title: 'Canlı Destek ve Müşteri Hizmetleri Rehberleri',
    subtitle:
      'Canlı destek, chatbot, WhatsApp destek ve müşteri deneyimi hakkında pratik rehberler. Satış ve memnuniyeti artırın.',
    readMore: 'Devamını oku',
    backToBlog: "Blog'a dön",
    ctaTitle: 'Gu Live Chat ile hemen başlayın',
    ctaButton: 'Ücretsiz Kayıt Ol',
    homeCrumb: 'Ana Sayfa',
    blogCrumb: 'Blog',
    notFound: 'Yazı bulunamadı',
    trialNote: '7 gün ücretsiz deneme — kredi kartı gerekmez',
  },
  knowledge: {
    titleSuffix: 'Bilgi Bankası',
    subtitle: 'Sık sorulan sorular ve yardım dokümanları',
    homeLink: 'Ana Sayfa',
    searchPlaceholder: 'Makale ara...',
    allArticles: 'Tüm Makaleler',
    back: 'Geri',
    views: 'görüntülenme',
    featuredTitle: 'Öne Çıkan Makaleler',
    allArticlesTitle: 'Tüm Makaleler',
    noResultsTitle: 'Makale bulunamadı',
    noResultsDesc: 'Aramanızla eşleşen makale yok',
    helpful: 'faydalı',
    footerPowered: 'Gu Live Chat ile desteklenmektedir',
  },
  urunler: {
    heroBadge: 'Dijital Ürün Kataloğu',
    heroTitle: 'Gu Live Chat abonelik paketleri ve eklentiler',
    heroSubtitle:
      'Gu Live Chat, fiziksel ürün satmayan bir SaaS (yazılım hizmeti) platformudur. Tüm ürünler dijital abonelik olarak sunulur; ödeme iyzico güvenli ödeme altyapısı ile alınır.',
    packagesBtn: 'Abonelik Paketleri',
    addonsBtn: 'Eklenti Mağazası',
    packagesTitle: 'Canlı Destek Abonelik Paketleri',
    packagesSubtitle: 'Aylık veya yıllık faturalandırma - KDV dahil fiyatlar - Anında dijital teslimat',
    monthly: 'Aylık',
    yearly: 'Yıllık',
    yearlyDiscount: '-20%',
    billingAria: 'Fatura dönemi',
    addonsTitle: 'Eklenti Mağazası',
    addonsSubtitle: 'Aboneliğinize ek olarak etkinleştirebileceğiniz dijital eklentiler - aylık abonelik',
    active: 'Aktif',
    buyNow: 'Satın Al',
    startFree: 'Ücretsiz Başla',
    getQuote: 'Teklif Al',
    productDetails: 'Ürün detayları',
    paymentNote:
      'Ödemeler iyzico güvenli ödeme altyapısı ile 256-bit SSL üzerinden ışlenir. Visa ve MasterCard kabul edilir. Dijital hizmetler satın alma sonrası anında hesabınıza tanımlanır.',
    comparePricing: 'Detaylı fiyat karşılaştırması',
    freeProduct: 'Ücretsiz',
    perMonth: '/ay',
  },
  hakkimizda: {
    badge: 'Kurumsal',
    title: 'Hakkımızda',
    subtitle:
      '{company}, ışletmelerin müşteri hizmetlerini canlı sohbet, AI asistan ve birleşik inbox ile yönetmesini sağlayan Türk yapımı bir SaaS platformudur.',
    sections: [
      {
        title: 'Şirket Profili',
        paragraphs: [
          '{company} ({name}), dijital müşteri deneyimini geliştirmek ıçin yerel ihtiyaclara uygun canlı destek ve otomasyon urunleri gelistirir.',
          'Iletişim bilgilerimiz: {email} - {phone}. Merkez adresimiz: {address}. Resmi web adresimiz: {url}.',
        ],
      },
      {
        title: 'Resmi Bilgiler',
        paragraphs: [
          'MERSIS: {mersis}',
          'Vergi Dairesi: {taxOffice} - Vergi No: {taxNo}',
        ],
      },
    ],
    servicesTitle: 'Hizmetlerimiz',
    servicesText:
      'Canlı sohbet widgeti, AI Agent, WhatsApp / e-posta / Messenger entegrasyonları, bilgi bankası, analitik ve ekip yönetimi araçları sunuyoruz.',
    sslTitle: 'SSL Sertifikası',
    sslText: 'Web sitemiz ({url}) tamamen HTTPS / 256-bit SSL sertifikası ile korunur.',
    salesTitle: 'Satış Modeli',
    salesText:
      "Gu Live Chat üzerinden dijital abonelik paketleri ve eklentiler sunulur. Fiziksel ürün bulunmaz; satın alma sonrası hizmet anında hesabınıza tanımlanır.",
    paymentTitle: 'Güvenli Ödeme (iyzico)',
    paymentText:
      'Abonelik ödemeleri iyzico güvenli ödeme altyapısı ile ışlenir. Visa ve MasterCard kabul edilir. Kredi kartı bilgileriniz tarafımızca saklanmaz.',
    legalDocsTitle: 'Yasal Belgeler',
    legalLinks: [
      { label: 'Gizlilik Sözleşmesi', href: '/gizlilik' },
      { label: 'Teslimat ve Iade Şartları', href: '/teslimat-iade' },
      { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satış' },
      { label: 'Ödeme Güvenliği', href: '/ödeme-güvenliği' },
    ],
    corpFields: {
      tradeName: 'Ticaret Unvanı',
      address: 'Adres',
      mersis: 'MERSIS',
      taxOffice: 'Vergi Dairesi',
      taxNo: 'Vergi No',
      email: 'E-posta',
      phone: 'Telefon',
      web: 'Web',
    },
  },
  ads: {
    login: 'Giriş',
    badge: "Türkiye'nın canlı destek platformu",
    title: 'Müşterilerinize anında ulaşın, satışları artırın',
    titleHighlight: 'anında',
    subtitle: 'Web sitenize 30 saniyede canlı sohbet ekleyin. AI destekli, WhatsApp entegre, ücretsiz başlayın.',
    proofs: ['Kredi kartı gerekmez', '7 gün PRO ücretsiz', 'Kurulum 30 saniye', 'KVKK uyumlu'],
    bullets: [
      'Canlı sohbet widget - sitenize tek satır kod',
      'AI chatbot - tekrarlayan soruları otomatik yanıtla',
      'WhatsApp ve e-posta - tek gelen kutusu',
      'Ziyaretçı takibi - kim sitede, hangi sayfada',
    ],
    cta: 'Ücretsiz Hesap Oluştur',
    statSetup: '30 sn',
    statSetupLabel: 'Kurulum süresi',
    statConversion: '%40',
    statConversionLabel: 'Dönüşüm artışı*',
    statCompliance: 'KVKK',
    statComplianceLabel: 'Uyumlu altyapı',
    disclaimer: '*Canlı destek kullanan ışletmelerde ortalama dönüşüm iyileşmesi - sektöre göre değışir.',
    copyright: 'Gu Live Chat © 2026 - gulivechat.com',
  },
  seoLandings: {
    canliDestek: {
      badge: 'Canlı Destek Yazılımı',
      h1: 'Web sitenize profesyonel canlı destek ekleyin',
      subtitle:
        "Gu Live Chat ile ziyaretçilerinize gerçek zamanlı yanıt verin. Canlı sohbet widget, ziyaretçı takibi, proaktif mesajlar ve AI destek - hepsi tek platformda. Türkiye'de üretildi, KVKK uyumlu.",
      cta: { label: 'Ücretsiz Canlı Destek Başlat', href: '/register' },
      benefits: [
        {
          title: '30 saniyede kurulum',
          desc: "Tek satır kod ile web sitenize canlı sohbet widget'ı ekleyin. Teknik bilgi gerekmez.",
        },
        {
          title: 'Ziyaretçı takibi',
          desc: 'Çevrimiçı ziyaretçileri gerçek zamanlı görün, hangi sayfada olduklarını bilin, proaktif mesaj gönderin.',
        },
        {
          title: 'AI destekli yanıt',
          desc: 'Tekrarlayan soruları chatbot ile otomatik yanıtlayın, temsilci yükünü azaltın.',
        },
        {
          title: 'Birleşik inbox',
          desc: 'Widget, WhatsApp, e-posta ve Messenger - tüm kanallar tek panelde.',
        },
        {
          title: 'Proaktif mesajlar',
          desc: 'Doğru anda doğru mesajı gönderin. Sepet terkini azaltın, dönüşümü artırın.',
        },
        {
          title: 'Analitik ve raporlar',
          desc: 'Yanıt süresi, memnuniyet puanı ve ekip performansını takip edin.',
        },
      ],
      sections: [
        {
          title: 'Canlı destek yazılımı nedir?',
          paragraphs: [
            "Canlı destek yazılımı, web sitenizi ziyaret eden müşterilerle gerçek zamanlı iletişim kurmanızı sağlayan bir araçtır. Ziyaretçiler sağ alt köşedeki sohbet widget'ından anında mesaj gönderebilir, temsilcileriniz aynı anda yanıt verebilir.",
            'E-posta desteğinin aksine canlı destek anlık çözüm sunar. Müşteriler satın alma kararı vermeden önce sorularına cevap alır, işletmeniz dönüşüm kaybını önler.',
            "Gu Live Chat, Türkiye'nın yerli canlı destek platformudur. iyzico ile güvenli ödeme, KVKK uyumu ve Türkçe arayüz ile yerel ışletmelere özel tasarlanmıştır.",
          ],
        },
        {
          title: 'Kimler canlı destek kullanmalı?',
          paragraphs: [
            'E-ticaret siteleri, SaaS şirketleri, ajanslar, eğitim kurumları ve hizmet sektöründeki tüm ışletmeler canlı destekten faydalanır. Özellikle yüksek değerli ürün satan veya karmaşık hizmet sunan firmalar ıçin vazgeçilmezdir.',
            'Küçük ekipler ücretsiz paket ile başlayabilir, büyüdükçe Profesyonel veya Kurumsal pakete geçebilir. 2 temsilciden sınırsız temsilciye kadar ölçeklenir.',
          ],
        },
      ],
      faqs: [
        {
          q: 'Canlı destek ücretsiz mı?',
          a: `Evet, Gu Live Chat ücretsiz paket ile 2 temsilci ve ayda 100 sohbet sunar. Ayrica ${trialFreeTierFaqLine().toLowerCase()}`,
        },
        {
          q: 'Kurulum ne kadar sürer?',
          a: "Widget kodunu sitenize yapıştırmanız yeterli - 30 saniyede canlı destek aktif olur. WordPress, Shopify ve özel siteler desteklenir.",
        },
        {
          q: 'Mobil uyumlu mü?',
          a: "Evet, Gu Live Chat widget'ı tüm cihazlarda sorunsuz çalışır. Responsive tasarım ile mobil ziyaretçiler de kolayca mesaj gönderebilir.",
        },
        {
          q: 'WhatsApp ile birlikte kullanılabilir mı?',
          a: "Evet, WhatsApp Business entegrasyonu ile WhatsApp mesajlarını aynı inbox'ta yönetirsiniz.",
        },
      ],
      relatedLinks: [
        { label: 'Chatbot Yazılımı', href: '/chatbot' },
        { label: 'WhatsApp Destek', href: '/whatsapp-destek' },
        { label: 'Fiyatlandırma', href: '/pricing' },
        { label: 'Özellikler', href: '/features' },
      ],
    },
    chatbot: {
      badge: 'Chatbot Yazılımı',
      h1: "7/24 otomatik müşteri hizmetleri chatbot'u",
      subtitle:
        "Gu Live Chat chatbot ile tekrarlayan soruları otomatik yanıtlayın. Görsel akış editörü, AI destekli yanıtlar ve akıllı temsilci yönlendirme. Temsilci yükünü %60'a kadar azaltın.",
      cta: { label: "Chatbot'u Ücretsiz Dene", href: '/register' },
      benefits: [
        {
          title: 'Görsel akış editörü',
          desc: 'Kod yazmadan chatbot akışları oluşturun. Sürükle-bırak arayüz ile dakikalar ıçinde yayına alın.',
        },
        {
          title: 'AI destekli yanıt',
          desc: "GPT ve Gemini ile doğal dilde yanıt. Bilgi bankanızı AI'a öğretin.",
        },
        {
          title: 'Akıllı yönlendirme',
          desc: 'Karmaşık talepleri otomatik olarak canlı temsilciye aktarın.',
        },
        {
          title: 'Çok kanallı',
          desc: "Widget, WhatsApp ve Messenger'da aynı chatbot akışlarını kullanın.",
        },
        {
          title: 'SSS otomasyonu',
          desc: 'Sık sorulan soruları chatbot ile yanıtlayın, temsilci zamanindan tasarruf edin.',
        },
        {
          title: 'Performans analizi',
          desc: "Hangi soruların en çok sorulduğunu görün, chatbot'u sürekli iyileştirin.",
        },
      ],
      sections: [
        {
          title: "Müşteri hizmetleri chatbot'u nasıl çalışır?",
          paragraphs: [
            "Chatbot, web sitenizdeki ziyaretçilerin sorularını otomatik yanıtlayan yapay zeka destekli bir asistandır. Karşılama mesajı gönderir, sık sorulan soruları yanıtlar ve gerektiğinde canlı temsilciye yönlendirir.",
            'Gu Live Chat chatbotu görsel editör ile kurulur. "Merhaba, size nasıl yardımcı olabilirim?" ile başlayan akışlar oluşturur, buton seçenekleri ve metin girişleri tanımlarsınız.',
            'Profesyonel pakette AI asistan devreye girer: bilgi bankanızdaki makaleleri okur, müşteri sorusunu anlar ve doğal dilde yanıt verir. Temsilci atanınca AI durur, insan devralır.',
          ],
        },
        {
          title: 'Chatbot ile ne kadar tasarruf edilir?',
          paragraphs: [
            "Ortalama bir müşteri hizmetleri ekibinin sorularının %60-80'ı tekrarlayan niteliktedir: kargo süresi, iade politikası, fiyat bilgisi gibi. Chatbot bu soruları 7/24 otomatik yanıtlar.",
            'Gece ve hafta sonu gelen talepler ertesi güne kalmaz - chatbot anında yanıt verir. Müşteri memnuniyeti artar, temsilci maliyeti düşer.',
          ],
        },
      ],
      faqs: [
        {
          q: 'Chatbot kurmak ıçin kod bilgisi gerekir mı?',
          a: 'Hayır. Gu Live Chat görsel chatbot editörü ile sürükle-bırak arayüzde akışlar oluşturursunuz.',
        },
        {
          q: 'AI chatbot hangi dilleri destekler?',
          a: 'Türkçe dahil 50+ dilde AI yanıt ve canlı çeviri desteklenir.',
        },
        {
          q: 'Chatbot canlı temsilci ile birlikte çalışır mı?',
          a: 'Evet. Chatbot basit soruları yanıtlar, karmaşık talepler otomatik olarak canlı temsilciye aktarılır.',
        },
        {
          q: 'Ücretsiz pakette chatbot var mı?',
          a: 'Temel chatbot akışları Başlangıç paketinde, AI destekli chatbot Profesyonel pakette yer alır.',
        },
      ],
      relatedLinks: [
        { label: 'Canlı Destek', href: '/canlı-destek' },
        { label: 'Yapay Zeka', href: '/ai' },
        { label: 'Blog: Chatbot Kurulum', href: '/blog/chatbot-kurulum-rehberi' },
        { label: 'Fiyatlandırma', href: '/pricing' },
      ],
    },
    whatsappDestek: {
      badge: 'WhatsApp Canlı Destek',
      h1: 'WhatsApp ile müşteri hizmetlerinizi güçlendirin',
      subtitle:
        "Gu Live Chat WhatsApp Business entegrasyonu ile WhatsApp mesajlarını tek inbox'ta yönetin. Canlı destek, chatbot ve ekip ataması - müşterilerinizin en sevdiğı kanaldan ulaşın.",
      cta: { label: 'WhatsApp Desteği Başlat', href: '/register' },
      benefits: [
        {
          title: 'Tek inbox',
          desc: 'WhatsApp, widget, e-posta ve Messenger mesajlarını aynı panelden yönetin.',
        },
        {
          title: 'WhatsApp chatbot',
          desc: 'Sık sorulan soruları WhatsApp üzerinden otomatik yanıtlayın.',
        },
        {
          title: 'Ekip ataması',
          desc: 'Gelen WhatsApp mesajlarını doğru temsilciye otomatik yönlendirin.',
        },
        {
          title: 'Mesaj geçmışı',
          desc: 'Tüm WhatsApp konuşma geçmışı müşteri profilinde saklanır.',
        },
        {
          title: 'Hazır cevaplar',
          desc: 'Sık kullanılan yanıtları hazır cevap olarak kaydedin, hızlı gönderin.',
        },
        {
          title: 'Bildirimler',
          desc: 'Yeni WhatsApp mesajı geldiğinde anında bildirim alın, hızlı yanıt verin.',
        },
      ],
      sections: [
        {
          title: 'Neden WhatsApp müşteri hizmetleri?',
          paragraphs: [
            "Türkiye'de WhatsApp en çok kullanılan mesajlaşma uygulamasıdır. Müşterileriniz zaten WhatsApp'ta - destek kanalınızı da oraya taşıyın.",
            'WhatsApp Business API ile profesyonel müşteri hizmetleri sunarsınız. Otomatik karşılama mesajları, chatbot akışları ve canlı temsilci desteği tek platformda.',
            "Gu Live Chat, WhatsApp mesajlarını widget ve e-posta ile aynı inbox'ta birleştirir. Temsilciniz hangi kanaldan gelirse gelsin aynı arayüzden yanıt verir.",
          ],
        },
        {
          title: 'WhatsApp destek nasıl kurulur?',
          paragraphs: [
            "Gu Live Chat hesabınızda Ayarlar > Kanallar bölümüne gidin. WhatsApp Business API bağlantınızı yapın ve eklenti mağazasından WhatsApp kanalını aktifleştirin.",
            "Chatbot akışlarınızı WhatsApp'a da uygulayın. Karşılama mesajı, menü seçenekleri ve temsilci yönlendirme kurallarını tanımlayın.",
            'Profesyonel paket WhatsApp entegrasyonunu ıçerir. Kurumsal pakette öncelikli destek ve SLA garantisi sunulur.',
          ],
        },
      ],
      faqs: [
        {
          q: 'WhatsApp Business hesabı gerekir mı?',
          a: 'Evet, WhatsApp Business API entegrasyonu ıçin doğrulanmış WhatsApp Business hesabı gereklidir.',
        },
        {
          q: "WhatsApp mesajları inbox'ta görünür mü?",
          a: "Evet, tüm WhatsApp mesajları birleşik gelen kutusunda widget ve e-posta ile birlikte görünür.",
        },
        {
          q: "Chatbot WhatsApp'ta çalışır mı?",
          a: "Evet, oluşturduğunuz chatbot akışları WhatsApp kanalında da otomatik yanıt verir.",
        },
        {
          q: 'Hangi pakette WhatsApp var?',
          a: 'WhatsApp entegrasyonu Profesyonel pakette ve eklenti mağazasından aktifleştirilebilir.',
        },
      ],
      relatedLinks: [
        { label: 'Canlı Destek', href: '/canlı-destek' },
        { label: 'Entegrasyonlar', href: '/integrations' },
        { label: 'Blog: WhatsApp Desteği', href: '/blog/whatsapp-ile-müşteri-desteği' },
        { label: 'Fiyatlandırma', href: '/pricing' },
      ],
    },
  },
  legal: {
    gizlilik: {
      badge: 'Yasal',
      title: 'Gizlilik Sözleşmesi',
      updated: 'Son güncelleme: Haziran 2026',
      sections: [
        {
          title: '1. Veri Sorumlusu',
          paragraphs: [
            '{company} ({name}), {address} adresinde faaliyet göstermektedir. Iletişim: {email} - {phone}.',
          ],
        },
        {
          title: '2. Toplanan Veriler',
          paragraphs: [
            'Hizmetlerimizi sunabilmek ıçin ad, soyad, e-posta, telefon, fatura bilgileri, IP adresi, tarayıcı ve cihaz bilgileri, sohbet kayıtları ve site kullanım verileri ışlenebilir.',
          ],
        },
        {
          title: '3. Ödeme ve Kart Verileri',
          paragraphs: [
            'Kredi/banka kartı ödemeleri iyzico güvenli ödeme altyapısı üzerinden, 256-bit SSL şifreleme ile gerçekleştirilir.',
            'Kart numarası, CVV ve benzeri hassas ödeme bilgileri tarafımızca saklanmaz; doğrudan iyzico tarafından PCI-DSS uyumlu ortamda ışlenir.',
          ],
        },
        {
          title: '4. Verilerin Kullanımı',
          paragraphs: [
            'Veriler; hizmet sağlama, abonelik yönetimi, müşteri desteği, fatura düzenleme, güvenlik, analitik ve yasal yükümlülükler kapsamında ışlenir.',
          ],
        },
        {
          title: '5. Veri Paylaşımı',
          paragraphs: [
            'Verileriniz; ödeme ışlemleri (iyzico), e-posta altyapısı ve yasal zorunluluk hallerinde yetkili kurumlarla paylaşılabilir.',
          ],
        },
        {
          title: '6. Saklama Süresi',
          paragraphs: [
            'Veriler hizmet ilişkişi süresince saklanır. Hesap silme talebinde veriler yasal saklama süreleri hariç 30 gün ıçinde silinir.',
          ],
        },
        {
          title: '7. Haklarınız',
          paragraphs: [
            'KVKK kapsamında erişim, düzeltme, silme, ışlemeyi kısıtlama ve itiraz haklarına sahipsiniz. Talepleriniz ıçin {email} adresi üzerinden bizimle iletişime gecebilirsiniz.',
          ],
        },
        {
          title: '8. Güvenli Bağlantı (SSL)',
          paragraphs: [
            '{url} adresi HTTPS (SSL/TLS) ile korunmaktadır. Tüm sayfa ve ödeme trafiğı şifreli kanal üzerinden iletilir.',
          ],
        },
      ],
    },
    teslimatIade: {
      badge: 'Yasal',
      title: 'Teslimat ve Iade Şartları',
      updated: 'Son güncelleme: 2026',
      sections: [
        {
          title: 'Satıcı Bilgileri',
          paragraphs: ['{company} - {address}', 'Iletişim: {email} - {phone}'],
        },
        {
          title: '1. Teslimat',
          paragraphs: [
            "{name} üzerinden satın alınan abonelik ve dijital hizmetler, ödeme onayından sonra elektronik ortamda hesabınıza tanımlanır. Erişim genellikle birkaç dakika ıçinde aktif hale gelir.",
            'Hizmet durumunuzu kontrol panelinizden ve e-posta bildirimlerinden takip edebilirsiniz.',
          ],
        },
        {
          title: '2. Iade Koşulları',
          paragraphs: [
            '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliğı uyarınca, elektronik ortamda anında ifa edilen dijital hizmetlerde cayma hakkı, hizmet ifasına başlandıktan ve tüketici onayı alındıktan sonra sona erer.',
            'Hizmet henüz başlamamışsa veya teknik nedenle erişim sağlanamıyorsa {email} adresine başvurarak iade talebinde bulunabilirsiniz.',
          ],
        },
        {
          title: '3. Abonelik Iptali',
          paragraphs: [
            'Aylık veya yıllık aboneliklerinizi panel üzerinden dönem sonuna kadar iptal edebilirsiniz. Kullanılmayan süre ıçin kısmi iade politikası paket koşullarında belirtilir.',
          ],
        },
        {
          title: '4. Iletişim',
          paragraphs: ['Teslimat ve iade talepleri: {email} - {phone}'],
        },
      ],
    },
    mesafeliSatis: {
      badge: 'Yasal',
      title: 'Mesafeli Satış Sözleşmesi',
      updated: 'Son güncelleme: 2026',
      sections: [
        {
          title: '1. Taraflar',
          paragraphs: [
            'Satıcı: {company} - E-posta: {email} - Telefon: {phone} - Adres: {address}',
            'MERSIS: {mersis} - Vergi Dairesi: {taxOffice} - Vergi No: {taxNo}',
            'Alıcı: Kayıt veya ödeme sırasında bilgileri verilen gerçek veya tüzel kişı.',
          ],
        },
        {
          title: '2. Konu',
          paragraphs: [
            "İşbu sözleşme, Alıcı'nın {url} üzerinden elektronik ortamda satın aldığı {name} abonelik ve dijital hizmetlerine ilişkin tarafların hak ve yükümlülüklerini düzenler.",
          ],
        },
        {
          title: '3. Hizmet ve Fiyat',
          paragraphs: [
            'Hizmet kapsamı ve bedel, sipariş / abonelik sırasında sitede gösterilen tutardır. Fiyatlara KDV dahildir (aksi belirtilmedikçe).',
          ],
        },
        {
          title: '4. Ödeme',
          paragraphs: [
            'Ödeme, iyzico güvenli ödeme altyapısı ile Visa / MasterCard kredi veya banka kartı üzerinden, 256-bit SSL korumalı bağlantı ile alınır.',
            'Ödeme onayından sonra hizmet ifasına başlanır. Kart bilgileri satıcı tarafından saklanmaz.',
          ],
        },
        {
          title: '5. Teslimat',
          paragraphs: [
            'Dijital hizmetler elektronik ortamda ifa edilir. Hesap erişimi ödeme onayından sonra sağlanır.',
          ],
        },
        {
          title: '6. Cayma Hakkı',
          paragraphs: [
            'Dijital ıçerik ve anında ifa edilen hizmetlerde, hizmet ifasına başlanması ile cayma hakkı tüketici onayı ile sona erer.',
          ],
        },
        {
          title: '7. Uyuşmazlık',
          paragraphs: [
            'Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. Şikayet ve itirazlar ıçin {email} adresine başvurabilirsiniz.',
          ],
        },
      ],
    },
    odemeGuvenligi: {
      badge: 'Güvenlik',
      title: 'Ödeme Güvenliği',
      sections: [
        {
          title: 'SSL Sertifikası',
          paragraphs: [
            '{url} tamamen HTTPS (256-bit SSL/TLS) ile korunur. Tarayıcı adres çubuğundaki kilit simgesi güvenli bağlantıyı gösterir.',
          ],
        },
        {
          title: 'iyzico Güvenli Ödeme',
          paragraphs: [
            "Tüm kart ödemeleri Türkiye'nın lisanslı ödeme kuruluşu iyzico altyapısı üzerinden ışlenir. 3D Secure doğrulama desteklenir.",
            'Kart bilgileri {name} sunucularında saklanmaz; PCI-DSS uyumlu ödeme ışleme iyzico tarafından sağlanır. Visa ve MasterCard kabul edilir.',
          ],
        },
        {
          title: 'Iletişim',
          paragraphs: ['Ödeme güvenliği hakkında sorularınız ıçin: {email} - {phone}'],
        },
      ],
    },
    kvkk: {
      badge: 'Yasal',
      title: 'KVKK Aydınlatma Metni',
      subtitle:
        '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu sifatimizla sizi bilgilendirmek isteriz.',
      sections: [
        {
          title: 'Veri Sorumlusu',
          paragraphs: ['{company}, {address} adresinde faaliyet göstermektedir ve KVKK kapsamında veri sorumlusu sıfatına sahiptir.'],
        },
        {
          title: 'Kişisel Verilerin İşlenme Amaçı',
          paragraphs: [
            'Toplanan kişisel verileriniz; hizmet sunumu, müşteri memnuniyeti, iletişim, pazarlama, hukuki yükümlülükler ve iş sürekliliğı amaçlarıyla ışlenir.',
          ],
        },
        {
          title: 'Verilerin Aktarılması',
          paragraphs: [
            'Kişisel verileriniz, yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz. Hizmet sağlayıcılarımızla sınırlı amaçlarla paylaşılabilir.',
          ],
        },
        {
          title: 'Haklarınız',
          paragraphs: [
            'KVKK madde 11 kapsamında; veri ışlenip ışlenmediğini öğrenme, bilgi talep etme, amaç ve uygun kullanımını öğrenme, yurt ıçı/yurt dışı aktarımını bilme, düzeltme, silme, itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz.',
            'Başvuru ıçin: {email}',
          ],
        },
      ],
    },
    cerez: {
      badge: 'Yasal',
      title: 'Çerez Politikası',
      subtitle: 'Bu site, size daha iyi bir kullanıcı deneyimi sunmak ıçin çerezler kullanmaktadır.',
      sections: [
        {
          title: 'Çerez Nedir?',
          paragraphs: [
            'Çerezler, web sitelerinin tarayıcınıza kaydettiğı küçük metin dosyalarıdır. Tercihlerinizi hatırlamak ve siteyi iyileştirmek ıçin kullanılır.',
          ],
        },
        {
          title: 'Kullandığımız Çerez Türleri',
          paragraphs: [
            'Zorunlu Çerezler: Sitenin düzgün çalışması ıçin gereklidir. Oturum ve güvenlik çerezleri.',
            'Performans Çerezleri: Site kullanım istatistiklerini toplar.',
            'İşlevsel Çerezler: Dil ve tema tercihlerinizi hatırlar.',
            'Hedefleme Çerezleri: Size özel ıçerik ve reklam gösterimi ıçin kullanılır.',
          ],
        },
        {
          title: 'Çerez Yönetimi',
          paragraphs: [
            'Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silebilirsiniz. Ancak bazı çerezleri devre dışı bırakmanız site ışlevselliğini etkileyebilir.',
            'Detaylı bilgi ıçin: {email}',
          ],
        },
      ],
    },
    kullanimSartlari: {
      badge: 'Yasal',
      title: 'Kullanım Şartları',
      updated: 'Son güncelleme: 2026',
      sections: [
        {
          title: '1. Hizmet Kullanımı',
          paragraphs: ['{name} hizmetlerini kullanarak bu şartları kabul etmiş olursunuz. Hizmeti yalnızca yasal amaçlar ıçin kullanabilirsiniz.'],
        },
        {
          title: '2. Hesap Güvenliği',
          paragraphs: ['Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Hesabınızda gerçekleşen tüm aktivitelerden siz sorumlusunuz.'],
        },
        {
          title: '3. Abonelik ve Ödemeler',
          paragraphs: ['Abonelikler aylık/yıllık olarak faturalandırılır. Iptal durumunda, faturalandırılan dönemin sonuna kadar hizmet devam eder.'],
        },
        {
          title: '4. Hizmet Kesintisi',
          paragraphs: ['Planlı bakım veya mücbir sebepler dışında %99.9 hizmet sürekliliğı hedeflenir. Kesintilerden doğabilecek zararlardan sorumlu değiliz.'],
        },
        {
          title: '5. Fikri Mülkiyet',
          paragraphs: ["Platformun tüm hakları {company}'e aittir. Izinsiz kopyalama, dağıtma veya tersine mühendislik yasaktır."],
        },
      ],
    },
  },
}
