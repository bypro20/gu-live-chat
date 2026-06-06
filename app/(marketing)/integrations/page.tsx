import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export const metadata: Metadata = {
  title: 'Entegrasyonlar',
  description: 'Gu Chat entegrasyonları — webhook, API, WhatsApp, e-posta ve daha fazlası.',
}

const integrations = [
  { name: 'Webhook & API', desc: 'REST API ve webhook ile kendi sistemlerinize bağlanın. conversation.created, message.sent ve daha fazlası.', status: 'Aktif' },
  { name: 'E-posta Kanalı', desc: 'Gelen e-postaları inbox\'a aktarın, yanıtları e-posta olarak gönderin.', status: 'Aktif' },
  { name: 'WhatsApp Business', desc: 'WhatsApp mesajlarını tek panelden yönetin. Eklenti mağazasından aktifleştirin.', status: 'Eklenti' },
  { name: 'Slack', desc: 'Yeni sohbet bildirimlerini Slack kanalınıza gönderin.', status: 'Yakında' },
  { name: 'Zapier', desc: 'Kodsuz otomasyon ile 5000+ uygulamaya bağlanın.', status: 'Yakında' },
  { name: 'Shopify & WooCommerce', desc: 'E-ticaret sitelerinize doğrudan entegrasyon.', status: 'Yakında' },
]

export default function IntegrationsPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12">
        <p className="section-label mb-4">Entegrasyonlar</p>
        <h1 className="text-4xl font-bold tracking-tight">Mevcut araçlarınızla bağlantı kurun</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Gu Chat, iş akışınıza sorunsuz entegre olur.
        </p>
      </div>

      <div className="space-y-4 mb-12">
        {integrations.map((item) => (
          <div key={item.name} className="surface p-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              item.status === 'Aktif' ? 'bg-success-light text-success'
              : item.status === 'Eklenti' ? 'bg-primary-light text-primary'
              : 'bg-muted text-muted-foreground'
            }`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">Özel entegrasyon ihtiyacınız mı var?</p>
        <Link href="/contact" className="btn-primary">
          İletişime Geç <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </MarketingPageShell>
  )
}
