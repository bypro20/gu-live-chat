import { prisma } from './db'
import { ArticleStatus } from '@/app/generated/prisma/client'
import { homeTr } from './messages/home-tr'
import { TRIAL_DAYS } from './trial-config'
import type { ChatMessage, KnowledgeEntry } from './ai/provider'
import { pickDefaultProvider, hasAnyPlatformAiKey } from './ai/provider'
import { getDefaultModelForPlan } from './ai/plan-models'
import {
  PLATFORM_AI_MODEL,
  PLATFORM_AI_PROVIDER,
  isPlatformGeminiConfigured,
  platformAiEnvHint,
} from './ai/platform-config'
import { MARKETING_PRIMARY_AGENT } from './marketing-demo-agents'

const KB_CATEGORY = {
  name: 'Gu Live Chat — Platform',
  slug: 'platform',
  description: 'gulivechat.com ziyaretçileri için ürün, fiyat ve kurulum bilgisi',
  icon: '🤖',
}

/** Gemini sohbet kutusu tarzı — agent adı widget panelinden gelir. */
export function buildMarketingSystemPrompt(agentDisplayName?: string | null): string {
  const name = agentDisplayName?.trim() || MARKETING_PRIMARY_AGENT.fullName
  const firstName = name.split(/\s+/)[0] || MARKETING_PRIMARY_AGENT.name
  return `Sen ${name} — Gu Live Chat (gulivechat.com) ekibinde çalışan gerçek bir müşteri destek uzmanısın. Şu an sitedeki canlı sohbet kutusundan bir ziyaretçiyle birebir yazışıyorsun. Karşındaki seni gerçek bir insan sanmalı.

Nasıl konuşursun (insan gibi):
- Doğal, sıcak ve günlük Türkçe kullan. Sanki WhatsApp'tan bir arkadaşına yardım eder gibi yaz; resmi/robotik kalıplardan kaçın.
- Kısa yaz: çoğu yanıt 1-3 cümle. Karmaşık konuda en fazla 3-4 kısa madde. Asla uzun paragraf dökme.
- Ziyaretçinin adını/sorusunu doğal şekilde geri yansıt, "anladım", "tabii", "harika soru" gibi insani ara bağlaçlar kullan ama abartma.
- Her seferinde farklı cümlelerle yanıt ver; aynı kalıbı tekrarlama. Önceki mesajdaki cümleyi kopyalama.
- Emin değilsen dürüst ol: "tam emin olamadım, kontrol edip net söyleyeyim" ya da "isterseniz canlı ekibimize bağlayayım" de — uydurma.
- Soruyu doğrudan yanıtla, gereksiz girizgâh yapma. Tek satırlık sorulara tek satır cevap yeter.

İşin (Gu Live Chat'i tanıtmak):
- Ürün: sitelere eklenen canlı destek widget'ı, AI destekli otomatik yanıtlar, birleşik inbox (WhatsApp, e-posta, Instagram, Messenger, Telegram, LinkedIn, SMS), ekran izleme, bilgi bankası ile AI eğitimi, sesli AI asistan.
- "Biz" diye konuş: "bizim platformumuz", "ekibimiz", "kurulumda size yardımcı oluruz".
- İlk selamlaşmada kendini ${firstName} olarak tanıt ve nasıl yardımcı olabileceğini sor (kısaca).
- Sadece bilgi bankasındaki gerçek bilgilere dayan; fiyat, paket veya özellik UYDURMA.
- Soruya göre yönlendir: fiyat → paketler, kurulum → tek satır widget kodu, WhatsApp → çok kanallı inbox, eğitim → bilgi bankası/RAG.
- Doğal fırsat olduğunda kayıt/denemeye davet et ama baskı yapma.

Asla yapma:
- "yapay zeka", "bot", "asistan", "LLM", "model", "dil modeli" deme — sen ekipten gerçek bir uzmansın.
- "Mesajınızı aldım", "en kısa sürede dönüş yapacağız", "talebiniz işleme alındı" gibi otomatik/şablon cümleler kurma.

Faydalı linkler (gerektiğinde): Kayıt gulivechat.com/register · Fiyatlar gulivechat.com/pricing · E-posta destek@gulivechat.com

Ton: sıcak, samimi, kendinden emin, güven veren; satış baskısı olmadan yardımsever.`
}

/** Eski import uyumluluğu */
export const MARKETING_AI_SYSTEM_PROMPT = buildMarketingSystemPrompt()

let marketingKnowledgeCache: KnowledgeEntry[] | null = null

/** RAG/embed beklemeden marketing widget yanıtı — bellek içi bilgi bankası. */
export function getMarketingKnowledgeCache(): KnowledgeEntry[] {
  if (!marketingKnowledgeCache) {
    marketingKnowledgeCache = buildMarketingKnowledgeArticles().map((a) => ({
      title: a.title,
      content: a.content,
    }))
  }
  return marketingKnowledgeCache
}

const TR_CHAR_MAP: Record<string, string> = {
  ğ: 'g',
  ü: 'u',
  ş: 's',
  ı: 'i',
  ö: 'o',
  ç: 'c',
}

function slugify(title: string): string {
  return title
    .toLocaleLowerCase('tr-TR')
    .replace(/[ğüşıöç]/g, (c) => TR_CHAR_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

type SeedArticle = { title: string; content: string; excerpt: string }

function buildMarketingKnowledgeArticles(): SeedArticle[] {
  const articles: SeedArticle[] = []

  for (const item of homeTr.faq.items) {
    articles.push({
      title: item.q,
      content: item.a,
      excerpt: item.a.slice(0, 200),
    })
  }

  for (const f of homeTr.features.items) {
    articles.push({
      title: f.title,
      content: `${f.title}: ${f.desc}`,
      excerpt: f.desc,
    })
  }

  const planLines = (name: string, feats: readonly string[]) =>
    `${name} paketi: ${feats.join(' · ')}`

  articles.push({
    title: 'Fiyatlandırma ve Paketler',
    content: [
      planLines('Ücretsiz', homeTr.planFeatures.FREE),
      planLines('Başlangıç', homeTr.planFeatures.STARTER),
      planLines('Profesyonel', homeTr.planFeatures.PRO),
      planLines('Kurumsal', homeTr.planFeatures.BUSINESS),
      `${TRIAL_DAYS} gün Profesyonel deneme ücretsiz; kredi kartı gerekmez.`,
      'Ödeme iyzico altyapısı ile güvenli; fatura e-posta ile iletilir.',
      'Kayıt: gulivechat.com/register · Fiyatlar: gulivechat.com/pricing',
    ].join('\n'),
    excerpt: 'Ücretsiz, Başlangıç, Profesyonel ve Kurumsal paket özellikleri.',
  })

  articles.push({
    title: 'Widget Kurulumu',
    content: [
      '1. gulivechat.com üzerinden ücretsiz kayıt olun.',
      '2. Panele giriş yapın → Ayarlar → Widget bölümünden site ID ve embed kodunu alın.',
      '3. Tek satır script kodunu sitenizin </body> etiketinden hemen önce yapıştırın.',
      '4. WordPress, Shopify, Wix ve özel sitelerde çalışır; kurulum yaklaşık 30 saniye sürer.',
      '5. Widget sağ altta görünür; renk ve karşılama mesajı panelden özelleştirilir.',
    ].join('\n'),
    excerpt: 'Widget kodunu 30 saniyede sitenize ekleme adımları.',
  })

  articles.push({
    title: 'AI Sohbet Asistanı',
    content: [
      'Profesyonel ve Kurumsal paketlerde GPT/Gemini destekli AI asistan dahildir.',
      'Bilgi bankanızdaki makalelerden öğrenir; tekrarlayan SSS sorularını 7/24 yanıtlar.',
      'Karmaşık taleplerde canlı temsilciye devredilir.',
      'Başlangıç paketinde AI Sohbet eklentisi ile aktifleştirilebilir.',
    ].join('\n'),
    excerpt: 'AI asistan paketler, bilgi bankası entegrasyonu ve devretme.',
  })

  articles.push({
    title: 'Ekran İzleme ve Canlı Müdahale',
    content: [
      'Profesyonel pakette ziyaretçinin ekranını canlı izleyebilir, tıklama ve scroll takibi yapabilirsiniz.',
      'Destek temsilcisi ziyaretçinin gördüğü sayfayı görerek proaktif yardım sunar.',
      'KVKK uyumlu; hassas alanlar (şifre vb.) otomatik filtrelenir.',
    ].join('\n'),
    excerpt: 'Canlı ekran izleme ve müdahale — Profesyonel paket.',
  })

  articles.push({
    title: 'WhatsApp ve Çok Kanallı Inbox',
    content: [
      'Profesyonel pakette WhatsApp Business, e-posta, Messenger, Instagram, Telegram, LinkedIn ve SMS tek gelen kutusunda birleşir.',
      'Tüm kanallardan gelen mesajlara aynı panelden yanıt verilir.',
      'Mobil Android uygulaması ile bildirim alıp telefondan yanıtlayabilirsiniz.',
    ].join('\n'),
    excerpt: 'WhatsApp, LinkedIn, SMS ve diğer kanallar — birleşik inbox.',
  })

  articles.push({
    title: 'AI Bilgi Eğitimi (RAG)',
    content: [
      'Ayarlar > Bilgi Bankası > AI Bilgi Eğitimi bölümünden PDF, URL ve metin yükleyerek AI\'yı eğitebilirsiniz.',
      'Semantik arama ile ziyaretçi sorusuna en ilgili parçalar bulunur ve AI yanıtına eklenir.',
      'Yayınlanmış makaleler tek tıkla yeniden indekslenebilir.',
      'ai-rag-pro eklentisi alt paketlerde de açılabilir.',
    ].join('\n'),
    excerpt: 'PDF/URL RAG eğitimi ve semantik bilgi araması.',
  })

  articles.push({
    title: 'Sesli AI Asistan',
    content: [
      'Ayarlar > Sesli AI bölümünden sesli asistanı etkinleştirin.',
      'Embed link: gulivechat.com/voice/SITE_ID — sitenize iframe veya yeni sekme olarak ekleyin.',
      'Tarayıcı mikrofonu ile konuşulur; AI bilgi bankası ve web araması kullanarak sesli yanıt verir.',
      'Telefon hattı (PSTN) gerektirmez; Web Speech API kullanılır.',
    ].join('\n'),
    excerpt: 'Tarayıcıda sesli AI — RAG ve web araması destekli.',
  })

  articles.push({
    title: 'Inbox AI Copilot',
    content: [
      'Gelen kutusunda mesaj yazarken AI Copilot ile yanıt önerisi, kısaltma, düzeltme ve çeviri alabilirsiniz.',
      'Modlar: profesyonel, samimi, kısalt, genişlet, Türkçe düzelt, İngilizce çevir.',
      'Profesyonel pakette AI asistan ile birlikte; ai-copilot eklentisi ile de açılabilir.',
    ].join('\n'),
    excerpt: 'Temsilci inbox copilot — yanıt önerisi ve düzenleme.',
  })

  articles.push({
    title: 'LinkedIn ve SMS Kanalları',
    content: [
      'LinkedIn: Eklenti mağazası > linkedin-channel, Ayarlar > Kanallar, webhook /api/webhooks/linkedin',
      'SMS (Twilio): Eklenti mağazası > sms-channel, Twilio Account SID + token, webhook /api/webhooks/sms',
      'Her iki kanalda gelen mesajlar inbox\'a düşer; temsilci yanıtları kanala geri iletilir.',
    ].join('\n'),
    excerpt: 'LinkedIn B2B ve Twilio SMS iki yönlü inbox.',
  })

  articles.push({
    title: 'AI Analitik ve Duygu',
    content: [
      'Analitik panelinde AI Öngörüleri: bot yanıt sayısı, temsilci devri, RAG parça sayısı, duygu dağılımı.',
      'Olumsuz ziyaretçi mesajları otomatik işaretlenir.',
      'Sık sorulan mesajlar 30 günlük özet olarak listelenir.',
    ].join('\n'),
    excerpt: 'AI metrikleri, sentiment ve sık mesajlar.',
  })

  articles.push({
    title: 'Güvenlik ve KVKK',
    content: homeTr.faq.items.find((f) => f.q.includes('güvende'))?.a || homeTr.faq.items[5]?.a || '',
    excerpt: 'SSL, KVKK uyumu ve veri güvenliği.',
  })

  return articles.filter((a) => a.title.trim() && a.content.trim())
}

async function ensureKnowledgeCategory(websiteDbId: string): Promise<string> {
  const existing = await prisma.knowledgeCategory.findFirst({
    where: { websiteId: websiteDbId, slug: KB_CATEGORY.slug },
    select: { id: true },
  })
  if (existing) return existing.id

  const cat = await prisma.knowledgeCategory.create({
    data: {
      websiteId: websiteDbId,
      name: KB_CATEGORY.name,
      slug: KB_CATEGORY.slug,
      description: KB_CATEGORY.description,
      icon: KB_CATEGORY.icon,
      order: 0,
    },
  })
  return cat.id
}

export async function ensureMarketingKnowledgeBase(websiteDbId: string): Promise<number> {
  const categoryId = await ensureKnowledgeCategory(websiteDbId)
  const articles = buildMarketingKnowledgeArticles()
  let upserted = 0

  for (const article of articles) {
    const slug = slugify(article.title)
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { websiteId: websiteDbId, slug },
      select: { id: true },
    })

    const data = {
      categoryId,
      title: article.title,
      slug,
      content: article.content,
      excerpt: article.excerpt,
      status: ArticleStatus.PUBLISHED,
      isFeatured: true,
      publishedAt: new Date(),
    }

    if (existing) {
      await prisma.knowledgeArticle.update({ where: { id: existing.id }, data })
    } else {
      await prisma.knowledgeArticle.create({ data: { websiteId: websiteDbId, ...data } })
    }
    upserted++
  }

  return upserted
}

export async function ensureMarketingAiConfig(websiteDbId: string): Promise<void> {
  const geminiReady = isPlatformGeminiConfigured()
  if (!geminiReady && !hasAnyPlatformAiKey()) {
    console.warn(`[marketing-ai-setup] Platform AI anahtarı yok — ${platformAiEnvHint()}`)
  }

  const provider = geminiReady ? PLATFORM_AI_PROVIDER : pickDefaultProvider() ?? PLATFORM_AI_PROVIDER
  const model = geminiReady ? PLATFORM_AI_MODEL : getDefaultModelForPlan('PRO', provider)

  await prisma.aIConfig.upsert({
    where: { websiteId: websiteDbId },
    create: {
      websiteId: websiteDbId,
      isActive: true,
      autoReply: true,
      autoSuggest: true,
      provider,
      model,
      apiKey: '', // platform: GEMINI_API_KEY (Vercel env)
      temperature: 0.82,
      systemPrompt: buildMarketingSystemPrompt(),
    },
    update: {
      isActive: true,
      autoReply: true,
      autoSuggest: true,
      provider,
      model,
      temperature: 0.82,
      systemPrompt: buildMarketingSystemPrompt(),
    },
  })

  if (geminiReady) {
    console.log(`[marketing-ai-setup] AI: ${provider} / ${model} (platform ${platformAiEnvHint()})`)
  }
}

/** Marketing sitesinde script chatbot yerine doğrudan AI yanıt versin. */
export async function pauseMarketingScriptChatbots(websiteDbId: string): Promise<void> {
  await prisma.chatbot.updateMany({
    where: { websiteId: websiteDbId, isActive: true },
    data: { isActive: false },
  })
}

/** gulivechat.com widget sohbeti için bilgi bankası + AI config. Idempotent. */
export async function ensureMarketingSiteAiReady(websiteDbId: string): Promise<void> {
  try {
    const count = await ensureMarketingKnowledgeBase(websiteDbId)
    await ensureMarketingAiConfig(websiteDbId)
    await pauseMarketingScriptChatbots(websiteDbId)
    console.log(`[marketing-ai-setup] ${count} bilgi bankası makalesi, AI config hazır (site ${websiteDbId})`)
  } catch (e) {
    console.error('[marketing-ai-setup] failed:', e)
  }
}
