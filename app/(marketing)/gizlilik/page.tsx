'use client'

import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'

export default function GizlilikPage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Yasal</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Gizlilik Politikası</h1>
        <p className="mt-4 text-sm text-muted-foreground">Son güncelleme: 2026</p>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">1. Toplanan Veriler</h2>
          <p>Gu Live Chat olarak, hizmetlerimizi sunabilmek için aşağıdaki kişisel verileri toplayabiliriz: ad, soyad, e-posta adresi, telefon numarası, IP adresi, tarayıcı bilgileri, cihaz bilgileri ve site kullanım verileri.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">2. Verilerin Kullanımı</h2>
          <p>Toplanan veriler; hizmet sağlama, müşteri desteği, hesap yönetimi, hizmet iyileştirme, analitik ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">3. Veri Paylaşımı</h2>
          <p>Verileriniz üçüncü taraflarla yalnızca hizmet sağlama amacıyla (ör. ödeme işlemleri, e-posta gönderimi) ve yasal zorunluluk hallerinde paylaşılır.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">4. Veri Saklama</h2>
          <p>Kişisel verileriniz, hizmet ilişkimiz devam ettiği sürece saklanır. Hesabınızı sildiğinizde verileriniz 30 gün içinde silinir.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">5. Haklarınız</h2>
          <p>KVKK kapsamında; verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama ve veri taşınabilirliği haklarına sahipsiniz. Talepleriniz için info@gulivechat.com adresine başvurabilirsiniz.</p>
        </section>
        <section>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">6. İletişim</h2>
          <p>Gizlilik politikamız hakkında sorularınız için: info@gulivechat.com</p>
        </section>
      </div>
    </MarketingPageShell>
  )
}
