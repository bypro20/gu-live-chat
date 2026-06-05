import { PrismaClient, AddonCategory, PurchaseType } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

const ADDONS: {
  slug: string; name: string; description: string; longDescription: string;
  category: AddonCategory; icon: string | null; imageUrl: string | null; price: number;
  purchaseType: PurchaseType; isFeatured: boolean; version: string;
  developer: string; docsUrl: string | null; configSchema: string;
  permissions: string; setupGuide: string;
}[] = [
  {
    slug: 'whatsapp-channel',
    name: 'WhatsApp Kanalı',
    description: 'WhatsApp Business API ile müşterilerinizle WhatsApp üzerinden iletişim kurun.',
    longDescription: 'WhatsApp Business API entegrasyonu sayesinde müşterileriniz size WhatsApp üzerinden ulaşabilir. Mesaj şablonları, hızlı yanıtlar ve otomatik mesajlaşma desteği ile müşteri deneyimini bir üst seviyeye taşıyın.',
    category: AddonCategory.SOCIAL,
    icon: '💬',
    imageUrl: null,
    price: 14900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: true,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', title: 'WhatsApp Numarası' },
        apiToken: { type: 'string', title: 'API Token' },
        webhookUrl: { type: 'string', title: 'Webhook URL' },
      },
    }),
    permissions: JSON.stringify(['messages:read', 'messages:write', 'contacts:read']),
    setupGuide: '1. WhatsApp Business API hesabı oluşturun\n2. API bilgilerini girin\n3. Webhook URL\'ini kaydedin',
  },
  {
    slug: 'email-campaigns',
    name: 'E-posta Kampanyaları',
    description: 'Toplu e-posta gönderimi, otomatik e-posta akışları ve pazarlama otomasyonu.',
    longDescription: 'Gelişmiş e-posta pazarlama araçları ile müşterilerinize toplu e-posta gönderin. Otomatik tetikleyiciler, A/B testi, açılma/tıklanma takibi ve detaylı raporlama ile kampanyalarınızı optimize edin.',
    category: AddonCategory.MARKETING,
    icon: '📧',
    imageUrl: null,
    price: 9900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: true,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        smtpHost: { type: 'string', title: 'SMTP Sunucusu' },
        smtpPort: { type: 'number', title: 'SMTP Port' },
        smtpUser: { type: 'string', title: 'SMTP Kullanıcı' },
        smtpPass: { type: 'string', title: 'SMTP Şifre' },
        fromEmail: { type: 'string', title: 'Gönderici E-posta' },
      },
    }),
    permissions: JSON.stringify(['emails:send']),
    setupGuide: '1. SMTP ayarlarınızı yapılandırın\n2. E-posta şablonu oluşturun\n3. Kampanyanızı başlatın',
  },
  {
    slug: 'ai-agent-pro',
    name: 'AI Asistan Pro',
    description: 'Gelişmiş yapay zeka asistanı ile müşteri sorularını otomatik yanıtlayın.',
    longDescription: 'GPT-4 ve Claude 3.5 desteği ile akıllı yanıtlar, otomatik çeviri, duygu analizi ve akıllı yönlendirme. Müşteri taleplerinin %70\'ine kadarını otomatik çözün.',
    category: AddonCategory.AI,
    icon: '🤖',
    imageUrl: null,
    price: 29900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: true,
    version: '2.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['openai', 'anthropic'], title: 'AI Sağlayıcı' },
        model: { type: 'string', title: 'Model' },
        apiKey: { type: 'string', title: 'API Anahtarı' },
        temperature: { type: 'number', title: 'Sıcaklık' },
        autoReply: { type: 'boolean', title: 'Oto-Yanıt' },
      },
    }),
    permissions: JSON.stringify(['ai:query']),
    setupGuide: '1. OpenAI veya Anthropic hesabı oluşturun\n2. API anahtarını girin\n3. AI asistanı etkinleştirin',
  },
  {
    slug: 'advanced-analytics',
    name: 'Gelişmiş Analitik',
    description: 'Detaylı raporlar, özel dashboardlar ve veri görselleştirme araçları.',
    longDescription: 'Müşteri davranış analizi, dönüşüm takibi, ısı haritaları, yolculuk haritası ve özel raporlar. CSV/PDF export, otomatik raporlama ve e-posta ile özetler.',
    category: AddonCategory.ANALYTICS,
    icon: '📊',
    imageUrl: null,
    price: 7900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: true,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        retentionDays: { type: 'number', title: 'Veri Saklama (gün)' },
        autoReport: { type: 'boolean', title: 'Otomatik Rapor' },
        reportEmail: { type: 'string', title: 'Rapor E-postası' },
      },
    }),
    permissions: JSON.stringify(['analytics:read', 'analytics:export']),
    setupGuide: '1. Eklentiyi etkinleştirin\n2. Rapor tercihlerinizi ayarlayın\n3. Detaylı analitiklere erişin',
  },
  {
    slug: 'crm-advanced',
    name: 'Gelişmiş CRM',
    description: 'Müşteri segmentasyonu, otomatik etiketleme ve gelişmiş filtreleme.',
    longDescription: 'Müşterilerinizi davranışlarına, demografik bilgilerine ve etkileşim geçmişine göre segmentlere ayırın. Otomatik etiketleme, özel alanlar ve gelişmiş filtreleme ile CRM\'inizi güçlendirin.',
    category: AddonCategory.CRM,
    icon: '👥',
    imageUrl: null,
    price: 5900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: false,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        customFields: { type: 'string', title: 'Özel Alanlar (JSON)' },
        autoTagging: { type: 'boolean', title: 'Oto-Etiketleme' },
        segmentationRules: { type: 'string', title: 'Segmentasyon Kuralları' },
      },
    }),
    permissions: JSON.stringify(['contacts:write', 'contacts:read']),
    setupGuide: '1. Özel alanları tanımlayın\n2. Otomatik etiketleme kuralları oluşturun\n3. Segmentasyonu etkinleştirin',
  },
  {
    slug: 'sla-manager',
    name: 'SLA Yöneticisi',
    description: 'Servis seviyesi anlaşmaları takibi, uyarılar ve otomatik yükseltme.',
    longDescription: 'SLA sürelerini tanımlayın, ihlal durumunda otomatik uyarılar alın ve ticketları otomatik yükseltin.',
    category: AddonCategory.SUPPORT,
    icon: '⏱️',
    imageUrl: null,
    price: 4900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: false,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        firstResponseTime: { type: 'number', title: 'İlk Yanıt Süresi (dk)' },
        resolutionTime: { type: 'number', title: 'Çözüm Süresi (dk)' },
        escalationUserId: { type: 'string', title: 'Yükseltme Kullanıcısı' },
      },
    }),
    permissions: JSON.stringify(['tickets:read', 'tickets:write']),
    setupGuide: '1. SLA sürelerini tanımlayın\n2. Uyarı tercihlerini ayarlayın\n3. Yükseltme kurallarını belirleyin',
  },
  {
    slug: 'messenger-channel',
    name: 'Facebook Messenger',
    description: 'Facebook Messenger entegrasyonu ile müşterilerinizle Messenger üzerinden iletişim.',
    longDescription: 'Facebook Messenger API entegrasyonu. Sayfa mesajları, otomatik yanıtlar ve chatbot desteği ile Facebook\'tan gelen müşteri taleplerini tek bir yerden yönetin.',
    category: 'SOCIAL',
    icon: '💭',
    imageUrl: null,
    price: 9900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: false,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        pageId: { type: 'string', title: 'Sayfa ID' },
        appId: { type: 'string', title: 'Uygulama ID' },
        pageToken: { type: 'string', title: 'Sayfa Token' },
      },
    }),
    permissions: JSON.stringify(['messages:read', 'messages:write']),
    setupGuide: '1. Facebook Developer hesabı oluşturun\n2. Uygulama oluşturun\n3. Sayfa token alın',
  },
  {
    slug: 'instagram-channel',
    name: 'Instagram Mesajlaşma',
    description: 'Instagram DM entegrasyonu ile Instagram mesajlarınızı yönetin.',
    longDescription: 'Instagram Business hesabınızı bağlayın ve gelen tüm DM\'leri Gu Live Chat üzerinden yanıtlayın.',
    category: 'SOCIAL',
    icon: '📸',
    imageUrl: null,
    price: 12900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: false,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        businessId: { type: 'string', title: 'İşletme ID' },
        accessToken: { type: 'string', title: 'Erişim Token' },
      },
    }),
    permissions: JSON.stringify(['messages:read', 'messages:write']),
    setupGuide: '1. Instagram Business hesabı oluşturun\n2. Facebook Developer Console\'da uygulama oluşturun\n3. API erişimi alın',
  },
  {
    slug: 'slack-integration',
    name: 'Slack Entegrasyonu',
    description: 'Slack kanallarına bildirimler ve mesaj senkronizasyonu.',
    longDescription: 'Yeni sohbetler, atanan ticketlar ve önemli olaylar için Slack kanallarına anlık bildirimler gönderin.',
    category: AddonCategory.AUTOMATION,
    icon: '🔔',
    imageUrl: null,
    price: 3900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: false,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', title: 'Webhook URL' },
        channel: { type: 'string', title: 'Kanal' },
        notifyOn: { type: 'array', items: { type: 'string' }, title: 'Bildirim Olayları' },
      },
    }),
    permissions: JSON.stringify(['notifications:send']),
    setupGuide: '1. Slack çalışma alanınızda Incoming Webhook oluşturun\n2. Webhook URL\'ini girin\n3. Bildirim tercihlerini ayarlayın',
  },
  {
    slug: 'white-label',
    name: 'Beyaz Etiket (White-label)',
    description: 'Tüm marka izlerini kaldırın, kendi markanızı kullanın.',
    longDescription: 'Widget\'dan dashboard\'a kadar tüm Gu Live Chat markasını kaldırın. Kendi logonuzu, renklerinizi ve alan adınızı kullanın.',
    category: AddonCategory.CUSTOM,
    icon: '🏷️',
    imageUrl: null,
    price: 19900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: true,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        companyName: { type: 'string', title: 'Şirket Adı' },
        logoUrl: { type: 'string', title: 'Logo URL' },
        faviconUrl: { type: 'string', title: 'Favicon URL' },
        customDomain: { type: 'string', title: 'Özel Domain' },
      },
    }),
    permissions: JSON.stringify(['branding:customize']),
    setupGuide: '1. Logonuzu yükleyin\n2. Renk şemasını ayarlayın\n3. Özel alan adınızı bağlayın',
  },
  {
    slug: 'ecommerce-tracker',
    name: 'E-ticaret Takibi',
    description: 'Sipariş takibi, sepetteki ürün görüntüleme ve satış analitiği.',
    longDescription: 'E-ticaret sitenizdeki müşteri davranışlarını izleyin. Sepete ekleme, sipariş takibi, terk edilen sepetler ve satış dönüşüm analitiği.',
    category: AddonCategory.ECOMMERCE,
    icon: '🛒',
    imageUrl: null,
    price: 14900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: false,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['woocommerce', 'shopify', 'magento', 'custom'], title: 'Platform' },
        apiKey: { type: 'string', title: 'API Anahtarı' },
        storeUrl: { type: 'string', title: 'Mağaza URL' },
      },
    }),
    permissions: JSON.stringify(['ecommerce:read']),
    setupGuide: '1. E-ticaret platformunuzu seçin\n2. API entegrasyonunu yapın\n3. Takibi etkinleştirin',
  },
  {
    slug: 'telegram-channel',
    name: 'Telegram Bot',
    description: 'Telegram botu ile müşterileriniz Telegram üzerinden size ulaşsın.',
    longDescription: 'Telegram bot entegrasyonu ile müşterileriniz Telegram üzerinden size mesaj gönderebilir.',
    category: 'SOCIAL',
    icon: '✈️',
    imageUrl: null,
    price: 4900,
    purchaseType: PurchaseType.MONTHLY,
    isFeatured: false,
    version: '1.0.0',
    developer: 'Gu Live Chat',
    docsUrl: null,
    configSchema: JSON.stringify({
      type: 'object',
      properties: {
        botToken: { type: 'string', title: 'Bot Token' },
        botUsername: { type: 'string', title: 'Bot Kullanıcı Adı' },
      },
    }),
    permissions: JSON.stringify(['messages:read', 'messages:write']),
    setupGuide: '1. Telegram\'da BotFather ile bot oluşturun\n2. Bot token alın\n3. Token\'ı girin ve etkinleştirin',
  },
]

async function main() {
  console.log(' Gu Live Chat eklentileri seedleniyor...')

  for (const addonData of ADDONS) {
    const existing = await prisma.addon.findUnique({
      where: { slug: addonData.slug },
    })

    if (!existing) {
      await prisma.addon.create({ data: addonData })
      console.log(`  ✅ ${addonData.name} eklendi`)
    } else {
      await prisma.addon.update({
        where: { slug: addonData.slug },
        data: addonData,
      })
      console.log(`  🔄 ${addonData.name} güncellendi`)
    }
  }

  console.log('✨ Tüm eklentiler başarıyla seedlendi!')
}

main()
  .catch((e) => {
    console.error(' Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
