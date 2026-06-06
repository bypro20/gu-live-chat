import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export const metadata: Metadata = {
  title: 'Yardım Merkezi',
  description: 'Gu Chat yardım merkezi — kurulum, widget, chatbot ve sık sorulan sorular.',
}

const categories = [
  {
    title: 'Başlangıç',
    articles: [
      { q: 'Gu Chat\'i nasıl kurarım?', a: 'Kayıt olduktan sonra Ayarlar > Widget bölümünden embed kodunu kopyalayıp sitenize yapıştırın.' },
      { q: 'Widget\'ı nasıl özelleştiririm?', a: 'Renk, pozisyon, karşılama mesajı ve avatar ayarlarını dashboard\'dan değiştirebilirsiniz.' },
      { q: 'Takım üyesi nasıl eklerim?', a: 'Ayarlar > Takım bölümünden e-posta ile davet gönderin.' },
    ],
  },
  {
    title: 'Sohbet & Inbox',
    articles: [
      { q: 'Hazır cevaplar nasıl kullanılır?', a: 'Inbox\'ta "/" yazarak hazır cevaplarınıza erişin.' },
      { q: 'Sohbet nasıl atanır?', a: 'Sohbet detayında sağ üstten temsilci seçerek atama yapabilirsiniz.' },
      { q: 'Dosya gönderimi destekleniyor mu?', a: 'Evet, görsel ve belge dosyaları gönderebilirsiniz (plan limitlerine tabi).' },
    ],
  },
  {
    title: 'Otomasyon & Entegrasyon',
    articles: [
      { q: 'Webhook nasıl kurulur?', a: 'Ayarlar > Webhook\'lar bölümünden URL ve event seçerek webhook oluşturun.' },
      { q: 'Chatbot nasıl çalışır?', a: 'Ayarlar > Chatbot bölümünden görsel editör ile adımlar oluşturun.' },
      { q: 'API dokümantasyonu nerede?', a: 'Profesyonel ve üzeri planlarda REST API erişimi mevcuttur. destek@guchat.org adresinden talep edin.' },
    ],
  },
]

export default function HelpPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12">
        <p className="section-label mb-4">Yardım</p>
        <h1 className="text-4xl font-bold tracking-tight">Yardım Merkezi</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Kurulum, kullanım ve sorun giderme rehberleri.
        </p>
      </div>

      <div className="space-y-10">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-bold mb-4">{cat.title}</h2>
            <div className="space-y-3">
              {cat.articles.map((a) => (
                <details key={a.q} className="surface group">
                  <summary className="p-4 cursor-pointer font-medium text-sm list-none flex items-center justify-between hover:bg-muted/30 transition-colors">
                    {a.q}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a.a}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 surface p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">Aradığınızı bulamadınız mı?</p>
        <Link href="/contact" className="btn-primary">
          Destek Ekibine Yaz <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </MarketingPageShell>
  )
}
