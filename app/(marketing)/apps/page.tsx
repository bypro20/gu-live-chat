import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Puzzle, MessageCircle, Mail, BarChart3, Shield, Zap } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export const metadata: Metadata = {
  title: 'Apps & Eklentiler',
  description: 'Gu Chat eklenti mağazası — WhatsApp, AI Pro, beyaz etiket ve daha fazlası.',
}

const apps = [
  { icon: MessageCircle, name: 'WhatsApp Kanalı', desc: 'WhatsApp Business mesajlarını inbox\'a aktarın.', price: '₺149/ay', status: 'Aktif' },
  { icon: Zap, name: 'AI Asistan Pro', desc: 'Gelişmiş bağlam analizi ve çok dilli yanıtlar.', price: '₺299/ay', status: 'Popüler' },
  { icon: Shield, name: 'Beyaz Etiket', desc: 'Kendi markanız, alan adınız ve renkleriniz.', price: '₺199/ay', status: 'Aktif' },
  { icon: BarChart3, name: 'Gelişmiş Analitik', desc: 'Özel raporlar, CSV export ve API erişimi.', price: '₺79/ay', status: 'Aktif' },
  { icon: Mail, name: 'E-posta Pro', desc: 'Gelen kutusu senkronizasyonu ve otomatik yanıtlar.', price: '₺99/ay', status: 'Aktif' },
  { icon: Puzzle, name: 'Zapier Bağlantısı', desc: '5000+ uygulamaya kodsuz entegrasyon.', price: 'Yakında', status: 'Yakında' },
]

export default function AppsPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12">
        <p className="section-label mb-4">Apps</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Eklenti mağazası</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Gu Chat’i ihtiyacınıza göre genişletin. Tek tıkla etkinleştirin, anında kullanın.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {apps.map((app) => (
          <div key={app.name} className="surface p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                <app.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                app.status === 'Popüler' ? 'bg-primary text-white'
                : app.status === 'Yakında' ? 'bg-muted text-muted-foreground'
                : 'bg-success-light text-success'
              }`}>{app.status}</span>
            </div>
            <h2 className="font-semibold mb-1">{app.name}</h2>
            <p className="text-sm text-muted-foreground flex-1 mb-4">{app.desc}</p>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="font-bold text-sm">{app.price}</span>
              {app.status !== 'Yakında' && (
                <Link href="/register" className="text-xs font-semibold text-primary hover:text-primary-hover">Ekle →</Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">Özel eklenti geliştirmek ister misiniz?</p>
        <Link href="/contact" className="btn-primary">
          İletişime Geç <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </MarketingPageShell>
  )
}
