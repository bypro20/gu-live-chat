import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { SITE_LEGAL } from '@/lib/site-legal'

export const metadata = {
  title: 'Ödeme Güvenliği',
  description: 'Gu Chat SSL ve iyzico güvenli ödeme altyapısı bilgileri.',
}

export default function OdemeGuvenligiPage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Güvenlik</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Ödeme Güvenliği</h1>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">SSL Sertifikası</h2>
          <p>
            {SITE_LEGAL.url} tamamıyla <strong className="text-foreground">HTTPS (256-bit SSL/TLS)</strong>{' '}
            ile korunur. Tarayıcı adres çubuğundaki kilit simgesi güvenli bağlantıyı gösterir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">iyzico Güvenli Ödeme</h2>
          <p>
            Tüm kart ödemeleri Türkiye&apos;nin lisanslı ödeme kuruluşu <strong className="text-foreground">iyzico</strong>{' '}
            altyapısı üzerinden işlenir. 3D Secure doğrulama desteklenir.
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
            <li>Kart bilgileri {SITE_LEGAL.name} sunucularında saklanmaz</li>
            <li>PCI-DSS uyumlu ödeme işleme (iyzico)</li>
            <li>Visa ve MasterCard kabul edilir</li>
          </ul>
        </section>
        <section className="py-4">
          <PaymentLogos variant="footer" />
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">İletişim</h2>
          <p>
            Ödeme güvenliği hakkında sorularınız için: {SITE_LEGAL.email} — {SITE_LEGAL.phone}
          </p>
        </section>
      </div>
    </MarketingPageShell>
  )
}
