import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bot, Sparkles, BookOpen, Workflow, MessageCircle, Check } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export const metadata: Metadata = {
  title: 'Yapay Zeka',
  description: 'Gu Chat AI asistan — otomatik yanıtlar, akıllı yönlendirme ve 7/24 müşteri desteği.',
}

const capabilities = [
  { icon: MessageCircle, title: 'Bağlama duyarlı yanıtlar', desc: 'Müşterinin sorusunu anlayarak bilgi bankasından en uygun cevabı sunar.' },
  { icon: BookOpen, title: 'Bilgi bankası entegrasyonu', desc: 'Makalelerinizi AI\'a öğretin, güncel bilgilerle yanıt verin.' },
  { icon: Workflow, title: 'Akıllı eskalasyon', desc: 'Karmaşık talepleri otomatik olarak canlı temsilciye aktarır.' },
  { icon: Sparkles, title: 'Öneri sistemi', desc: 'Temsilcilere yanıt önerileri sunarak yanıt süresini kısaltır.' },
]

const steps = [
  'Bilgi bankanızı oluşturun veya mevcut makaleleri içe aktarın',
  'Chatbot akışlarını görsel editörde tanımlayın',
  'AI asistanı etkinleştirin ve test edin',
  'Performansı analitik panelden takip edin',
]

export default function AiPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12">
        <p className="section-label mb-4">Yapay Zeka</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Akıllı destek, gerçek sonuçlar</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Gu Chat AI asistanı tekrarlayan soruları otomatik yanıtlar, ekibinize zaman kazandırır
          ve müşterilerinize 7/24 kesintisiz destek sunar.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        {capabilities.map((c) => (
          <div key={c.title} className="surface p-5">
            <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
              <c.icon className="w-5 h-5" />
            </div>
            <h2 className="font-semibold mb-2">{c.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="surface p-8 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Nasıl başlanır?</h2>
            <p className="text-sm text-muted-foreground">4 adımda AI asistanınızı devreye alın</p>
          </div>
        </div>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
              <span className="text-muted-foreground pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {['%40 daha az tekrarlayan soru', '7/24 otomatik yanıt', 'Tek tıkla temsilciye devret'].map((stat) => (
          <div key={stat} className="surface p-4 text-center">
            <Check className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-sm font-medium">{stat}</p>
          </div>
        ))}
      </div>

      <div className="surface p-8 text-center bg-gradient-brand-subtle">
        <h2 className="text-xl font-bold mb-2">AI asistanını deneyin</h2>
        <p className="text-sm text-muted-foreground mb-5">Profesyonel planda AI özellikleri dahildir.</p>
        <Link href="/register" className="btn-primary">
          Ücretsiz Başla <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </MarketingPageShell>
  )
}
