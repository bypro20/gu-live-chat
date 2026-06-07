import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MessageCircle, Bot, Users, BarChart3, Workflow, Blocks, Shield, Zap } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export const metadata: Metadata = {
  title: 'Özellikler',
  description: 'Gu Chat canlı destek platformunun tüm özellikleri — gerçek zamanlı sohbet, chatbot, analitik ve daha fazlası.',
}

const allFeatures = [
  { id: 'widget', icon: MessageCircle, title: 'Gerçek Zamanlı Sohbet', desc: 'WebSocket tabanlı anlık mesajlaşma, yazıyor göstergesi, okundu onayı ve dosya paylaşımı.' },
  { icon: Bot, title: 'AI Chatbot & Otomasyon', desc: 'Görsel editör ile chatbot akışları oluşturun. AI destekli akıllı yanıtlar.' },
  { id: 'crm', icon: Users, title: 'Ziyaretçi İzleme', desc: 'Canlı ziyaretçi listesi, sayfa geçmişi, scroll derinliği ve davranış takibi.' },
  { icon: Blocks, title: 'Çoklu Kanal', desc: 'Web widget, e-posta ve mesajlaşma kanallarını tek inbox\'ta birleştirin.' },
  { icon: Workflow, title: 'Workflow Otomasyonu', desc: 'Tetikleyici ve aksiyon tabanlı otomatik yanıt akışları.' },
  { id: 'analytics', icon: BarChart3, title: 'Gelişmiş Analitik', desc: 'Yanıt süreleri, çözüm oranları, ekip performansı ve CSV export.' },
  { icon: Shield, title: 'Güvenlik & Uyumluluk', desc: 'SSL/TLS şifreleme, KVKK uyumu, IP ban sistemi ve rol tabanlı erişim.' },
  { icon: Zap, title: 'Hızlı Kurulum', desc: 'Tek satır embed kodu ile 30 saniyede sitenize entegre edin.' },
]

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12">
        <p className="section-label mb-4">Özellikler</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Gu Chat ile neler yapabilirsiniz?</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Müşteri destek sürecinizi uçtan uca yönetmek için ihtiyacınız olan tüm araçlar.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        {allFeatures.map((f) => (
          <div key={f.title} id={'id' in f ? f.id : undefined} className="surface p-5 scroll-mt-28">
            <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5" />
            </div>
            <h2 className="font-semibold mb-2">{f.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="surface p-8 text-center bg-gradient-brand-subtle">
        <h2 className="text-xl font-bold mb-2">Hemen deneyin</h2>
        <p className="text-sm text-muted-foreground mb-5">Ücretsiz plan ile tüm temel özelliklere erişin.</p>
        <Link href="/register" className="btn-primary">
          Ücretsiz Başla <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </MarketingPageShell>
  )
}
