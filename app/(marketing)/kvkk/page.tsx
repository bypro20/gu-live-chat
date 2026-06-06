'use client'

import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export default function KvkkPage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Yasal</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">KVKK Aydınlatma Metni</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Gu Live Chat olarak veri sorumlusu sıfatıyla sizi bilgilendirmek isteriz.
        </p>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Veri Sorumlusu</h2>
          <p>Gu Live Chat, [Şirket Bilgileri] adresinde faaliyet göstermektedir. KVKK kapsamında veri sorumlusu sıfatına sahiptir.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Kişisel Verilerin İşlenme Amacı</h2>
          <p>Toplanan kişisel verileriniz; hizmet sunumu, müşteri memnuniyeti, iletişim, pazarlama, hukuki yükümlülükler ve iş sürekliliği amaçlarıyla işlenmektedir.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Verilerin Aktarılması</h2>
          <p>Kişisel verileriniz, yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz. Hizmet sağlayıcılarımızla sınırlı amaçlarla paylaşılabilir.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Haklarınız</h2>
          <p>KVKK madde 11 kapsamında; veri işlenip işlenmediğini öğrenme, bilgi talep etme, amaç ve uygun kullanımını öğrenme, yurt içi/yurt dışı aktarımını bilme, düzeltme, silme, itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>
          <p className="mt-4">Başvuru için: info@gulivechat.com</p>
        </section>
      </div>
    </MarketingPageShell>
  )
}
