import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { SITE_LEGAL } from '@/lib/site-legal'

export const metadata = {
  title: 'Gizlilik Sözleşmesi',
  description: 'Gu Chat gizlilik sözleşmesi ve kişisel verilerin korunması.',
}

export default function GizlilikPage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Yasal</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Gizlilik Sözleşmesi</h1>
        <p className="mt-4 text-sm text-muted-foreground">Son güncelleme: Haziran 2026</p>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Veri Sorumlusu</h2>
          <p>
            {SITE_LEGAL.legalName} ({SITE_LEGAL.name}), {SITE_LEGAL.address} adresinde faaliyet
            göstermektedir. İletişim: {SITE_LEGAL.email} — {SITE_LEGAL.phone}
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Toplanan Veriler</h2>
          <p>
            Hizmetlerimizi sunabilmek için ad, soyad, e-posta, telefon, fatura bilgileri, IP adresi,
            tarayıcı ve cihaz bilgileri, sohbet kayıtları ve site kullanım verileri işlenebilir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Ödeme ve Kart Verileri</h2>
          <p>
            Kredi/banka kartı ödemeleri <strong className="text-foreground">iyzico</strong> güvenli
            ödeme altyapısı üzerinden, 256-bit SSL şifreleme ile gerçekleştirilir. Kart numarası,
            CVV ve benzeri hassas ödeme bilgileri <strong className="text-foreground">tarafımızca
            saklanmaz</strong>; doğrudan iyzico tarafından PCI-DSS uyumlu ortamda işlenir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Verilerin Kullanımı</h2>
          <p>
            Veriler; hizmet sağlama, abonelik yönetimi, müşteri desteği, fatura düzenleme, güvenlik,
            analitik ve yasal yükümlülükler kapsamında işlenir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Veri Paylaşımı</h2>
          <p>
            Verileriniz; ödeme işlemleri (iyzico), e-posta altyapısı ve yasal zorunluluk hallerinde
            yetkili kurumlarla paylaşılabilir. Detaylı KVKK bilgilendirmesi için{' '}
            <a href="/kvkk" className="text-primary hover:underline">KVKK Aydınlatma Metni</a>{' '}
            sayfasına bakınız.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Saklama Süresi</h2>
          <p>
            Veriler hizmet ilişkisi süresince saklanır. Hesap silme talebinde veriler yasal saklama
            süreleri hariç 30 gün içinde silinir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Haklarınız</h2>
          <p>
            KVKK kapsamında erişim, düzeltme, silme, işlemeyi kısıtlama ve itiraz haklarına sahipsiniz.
            Talepler: {SITE_LEGAL.email}
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Güvenli Bağlantı (SSL)</h2>
          <p>
            {SITE_LEGAL.url} adresi HTTPS (SSL/TLS) ile korunmaktadır. Tüm sayfa ve ödeme trafiği
            şifreli kanal üzerinden iletilir.
          </p>
          <div className="py-6">
            <PaymentLogos variant="footer" />
          </div>
        </section>
      </div>
    </MarketingPageShell>
  )
}
