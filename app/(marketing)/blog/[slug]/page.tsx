import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { notFound } from 'next/navigation'

const posts: Record<string, { title: string; date: string; content: string[] }> = {
  'canli-destek-neden-onemli': {
    title: 'Canlı Destek Neden Önemli?',
    date: '15 Mayıs 2026',
    content: [
      'Müşteriler anında yanıt bekliyor. Araştırmalar, yanıt süresinin 1 dakikadan fazla gecikmesi halinde dönüşüm oranının %40\'a kadar düştüğünü gösteriyor.',
      'Canlı destek, web sitenizdeki ziyaretçilerle gerçek zamanlı iletişim kurmanızı sağlar. Sorular anında yanıtlanır, tereddüt eden müşteriler satın almaya ikna olur.',
      'Gu Chat ile widget\'ınızı 30 saniyede kurabilir, chatbot ile tekrarlayan soruları otomatik yanıtlayabilir ve ekibinizin verimliliğini artırabilirsiniz.',
    ],
  },
  'chatbot-kurulum-rehberi': {
    title: 'Chatbot Kurulum Rehberi',
    date: '8 Mayıs 2026',
    content: [
      'Gu Chat chatbot\'u görsel bir editör ile kurulur. Kod yazmanıza gerek yok.',
      'İlk adım: Ayarlar > Chatbot bölümüne gidin ve yeni bir akış oluşturun. Karşılama mesajı, soru-cevap adımları ve temsilciye yönlendirme kurallarını tanımlayın.',
      'Bilgi bankanızı chatbot\'a bağlayarak AI destekli yanıtlar alabilirsiniz. Test modunda akışı deneyin, ardından yayına alın.',
    ],
  },
  'musteri-deneyimi-ipuclari': {
    title: 'Müşteri Deneyimi İpuçları',
    date: '1 Mayıs 2026',
    content: [
      'Hızlı yanıt vermek müşteri memnuniyetinin temelidir. Ortalama yanıt sürenizi analitik panelden takip edin ve hedef belirleyin.',
      'Hazır cevaplar kullanarak sık sorulan sorulara tutarlı yanıtlar verin. Inbox\'ta "/" yazarak hazır cevaplarınıza erişin.',
      'Proaktif mesajlar ile ziyaretçilerinize doğru anda ulaşın. Sepet terk eden kullanıcılara yardım teklif edin veya yeni ziyaretçileri karşılayın.',
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = posts[slug]
  if (!post) return { title: 'Yazı bulunamadı' }
  return { title: post.title, description: post.content[0] }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts[slug]
  if (!post) notFound()

  return (
    <MarketingPageShell>
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Blog&apos;a dön
      </Link>
      <article>
        <time className="text-xs text-muted-foreground">{post.date}</time>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2 mb-8">{post.title}</h1>
        <div className="prose prose-neutral max-w-none space-y-4">
          {post.content.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>
      </article>
    </MarketingPageShell>
  )
}
