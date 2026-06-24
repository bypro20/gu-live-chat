import { SITE_URL } from '@/lib/seo'
import { submitIndexNow } from '@/lib/seo-indexing'
import { askMarketingAi, isOrganicAiAvailable, parseAiJson } from './ai'
import { buildGuLiveChatProductBrief } from './product-brief'
import { getOrganicMarketingPlan } from './storage'
import { createMarketingBlogPost, getLastMarketingBlogPublishedAt } from '@/lib/marketing-blog'
import type { ContentTask } from './types'

type AiBlogPayload = {
  title: string
  slug?: string
  excerpt: string
  content: string[]
  keywords: string[]
}

export async function shouldPublishBlogToday(intervalDays: number): Promise<boolean> {
  const last = await getLastMarketingBlogPublishedAt()
  if (!last) return true
  const daysSince = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= intervalDays
}

export async function autoPublishBlogArticle(task?: ContentTask): Promise<{
  ok: boolean
  slug?: string
  url?: string
  error?: string
}> {
  const plan = await getOrganicMarketingPlan()
  const brief = plan.productBrief || buildGuLiveChatProductBrief()
  const audience = plan.audiences[0]

  let article: AiBlogPayload | null = null

  if (isOrganicAiAvailable()) {
    const topic =
      task?.title ||
      task?.hook ||
      plan.strategies[0]?.contentIdeas[0] ||
      'Canlı destek yazılımı ile müşteri dönüşümünü artırma'

    const raw = await askMarketingAi(
      'SEO blog yazarısın. JSON şema: { "title", "slug"?, "excerpt", "content": string[] (4-6 paragraf), "keywords": string[] }',
      `${brief}\n\nKonu: ${topic}\nHedef kitle: ${audience?.name ?? 'KOBİ'}\n\n800-1200 kelimelik SEO blog yazısı üret. Gu Live Chat doğal geçsin. Türkçe.`
    )
    article = parseAiJson<AiBlogPayload>(raw)
  }

  if (!article?.title || !article.content?.length) {
    article = {
      title: task?.title || 'Canlı Destek ile Müşteri Memnuniyetini Artırmanın 5 Yolu',
      excerpt:
        task?.hook ||
        'Gu Live Chat ile web sitenize anında destek ekleyin, dönüşüm oranınızı yükseltin.',
      content: [
        task?.body ||
          'Müşteriler hızlı yanıt bekliyor. Canlı destek yazılımı bu beklentiyi karşılayarak satış ve memnuniyeti artırır.',
        'Gu Live Chat widget\'ını 30 saniyede kurabilir, WhatsApp ve site mesajlarını tek inbox\'ta yönetebilirsiniz.',
        'AI chatbot tekrarlayan soruları otomatik yanıtlar; temsilcileriniz karmaşık taleplere odaklanır.',
        'Proaktif mesajlar ve ziyaretçi takibi ile tereddüt eden ziyaretçilere doğru anda ulaşın.',
        'Ücretsiz paket ile hemen başlayın — kredi kartı gerekmez.',
      ],
      keywords: ['canlı destek', 'live chat', 'Gu Live Chat', 'müşteri hizmetleri'],
    }
  }

  try {
    const post = await createMarketingBlogPost({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      keywords: article.keywords ?? [],
      slug: article.slug,
      taskId: task?.id,
      source: 'auto',
    })

    const url = `${SITE_URL}/blog/${post.slug}`
    await submitIndexNow([url, `${SITE_URL}/blog`, `${SITE_URL}/sitemap.xml`])

    return { ok: true, slug: post.slug, url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Blog yayınlanamadı' }
  }
}
