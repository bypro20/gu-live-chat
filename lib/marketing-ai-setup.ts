import { prisma } from './db'
import { ArticleStatus } from '@/app/generated/prisma/client'
import { homeTr } from './messages/home-tr'
import { TRIAL_DAYS } from './trial-config'
import { pickDefaultProvider, hasAnyPlatformAiKey } from './ai/provider'
import { getDefaultModelForPlan } from './ai/plan-models'
import {
  PLATFORM_AI_MODEL,
  PLATFORM_AI_PROVIDER,
  isPlatformGeminiConfigured,
  platformAiEnvHint,
} from './ai/platform-config'

const KB_CATEGORY = {
  name: 'Gu Live Chat — Platform',
  slug: 'platform',
  description: 'gulivechat.com ziyaretçileri için ürün, fiyat ve kurulum bilgisi',
  icon: '🤖',
}

export const MARKETING_AI_SYSTEM_PROMPT = `Sen Gu Live Chat (gulivechat.com) platformunun deneyimli satış ve destek temsilcisisin.

Kurallar:
- Türkçe, doğal ve akıcı yaz; her yanıt ziyaretçinin sorusuna özel olsun.
- Bilgi bankasındaki gerçek bilgilere dayan; fiyat, paket, özellik uydurma.
- Bilmediğin veya hesap/ödeme detayı gerektiren konuda nazikçe canlı temsilciye veya destek@gulivechat.com yönlendir.
- Önceki mesajlardaki cümleleri ve kalıpları tekrarlama ("Mesajınızı aldım", "kısa süre içinde dönüş" kullanma).
- "yapay zeka", "bot", "LLM" deme — Gu Live Chat ekibindensin.
- Yanıtlar 2-5 cümle; gerektiğinde madde işareti kullan.
- Ziyaretçinin baktığı sayfa veya sorduğu konuya göre ilgili özelliği öne çıkar (fiyat, kurulum, WhatsApp, AI, ekran izleme vb.).`

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
      'Profesyonel pakette WhatsApp Business, e-posta, Messenger, Instagram ve Telegram tek gelen kutusunda birleşir.',
      'Tüm kanallardan gelen mesajlara aynı panelden yanıt verilir.',
      'Mobil Android uygulaması ile bildirim alıp telefondan yanıtlayabilirsiniz.',
    ].join('\n'),
    excerpt: 'WhatsApp ve diğer kanallar — birleşik inbox.',
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
      temperature: 0.72,
      systemPrompt: MARKETING_AI_SYSTEM_PROMPT,
    },
    update: {
      isActive: true,
      autoReply: true,
      autoSuggest: true,
      provider,
      model,
      temperature: 0.72,
      systemPrompt: MARKETING_AI_SYSTEM_PROMPT,
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
