import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Gu Chat blog — canlı destek, müşteri deneyimi ve ürün güncellemeleri.',
}

const posts = [
  { slug: 'canli-destek-neden-onemli', title: 'Canlı Destek Neden Önemli?', date: '15 Mayıs 2026', excerpt: 'Müşteri memnuniyetini artırmak için canlı desteğin işletmenize katkıları.' },
  { slug: 'chatbot-kurulum-rehberi', title: 'Chatbot Kurulum Rehberi', date: '8 Mayıs 2026', excerpt: 'Gu Chat chatbot\'unuzu 10 dakikada kurun ve otomatik yanıtlar vermeye başlayın.' },
  { slug: 'musteri-deneyimi-ipuclari', title: 'Müşteri Deneyimi İpuçları', date: '1 Mayıs 2026', excerpt: 'Yanıt süresini kısaltmak ve çözüm oranını artırmak için 5 pratik öneri.' },
]

export default function BlogPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12">
        <p className="section-label mb-4">Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Haberler ve rehberler</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Canlı destek, müşteri deneyimi ve ürün güncellemeleri hakkında yazılar.
        </p>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="surface p-6 hover:shadow-md transition-shadow">
            <time className="text-xs text-muted-foreground">{post.date}</time>
            <h2 className="text-xl font-semibold mt-2 mb-2">{post.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4 hover:text-primary-hover">
              Devamını oku <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </MarketingPageShell>
  )
}
