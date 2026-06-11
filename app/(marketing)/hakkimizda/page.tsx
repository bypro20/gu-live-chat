import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { SITE_LEGAL } from '@/lib/site-legal'

export const metadata = {
  title: 'Hakkımızda',
  description: 'Gu Chat — Türk yapımı canlı destek ve AI sohbet platformu hakkında kurumsal bilgiler.',
}

export default function HakkimizdaPage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Kurumsal</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hakkımızda</h1>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">{SITE_LEGAL.legalName}</strong>, işletmelerin müşteri
          hizmetlerini canlı sohbet, AI asistan ve birleşik inbox ile yönetmesini sağlayan Türk
          yapımı bir SaaS platformudur.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Kurumsal Bilgiler</h2>
          <ul className="space-y-1 text-sm">
            <li><strong className="text-foreground">Ticaret Unvanı:</strong> {SITE_LEGAL.legalName}</li>
            <li><strong className="text-foreground">Adres:</strong> {SITE_LEGAL.address}</li>
            <li><strong className="text-foreground">MERSİS:</strong> {SITE_LEGAL.mersis}</li>
            <li><strong className="text-foreground">Vergi Dairesi:</strong> {SITE_LEGAL.taxOffice}</li>
            <li><strong className="text-foreground">Vergi No:</strong> {SITE_LEGAL.taxNo}</li>
            <li><strong className="text-foreground">E-posta:</strong> {SITE_LEGAL.email}</li>
            <li><strong className="text-foreground">Telefon:</strong> {SITE_LEGAL.phone}</li>
            <li><strong className="text-foreground">Web:</strong> {SITE_LEGAL.url}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Hizmetlerimiz</h2>
          <p>
            Canlı sohbet widget&apos;ı, AI Agent, WhatsApp / e-posta / Messenger entegrasyonları,
            bilgi bankası, analitik ve ekip yönetimi araçları sunuyoruz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">SSL Sertifikası</h2>
          <p>
            Web sitemiz ({SITE_LEGAL.url}) tamamıyla <strong className="text-foreground">HTTPS /
            256-bit SSL</strong> sertifikası ile korunmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Satış Modeli</h2>
          <p>
            Gu Chat üzerinden <strong className="text-foreground">dijital abonelik paketleri</strong> ve{' '}
            <strong className="text-foreground">eklentiler</strong> satılmaktadır. Fiziksel ürün
            bulunmamaktadır; satın alma sonrası hizmet anında hesabınıza tanımlanır. Tüm fiyatlar{' '}
            <a href="/urunler" className="text-primary hover:underline">ürünler sayfamızda</a>{' '}
            açıkça listelenmiştir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Güvenli Ödeme (iyzico)</h2>
          <p>
            Abonelik ödemeleri <strong className="text-foreground">iyzico</strong> güvenli ödeme
            altyapısı ile işlenir. Visa ve MasterCard kabul edilir. Kredi kartı bilgileriniz
            tarafımızca saklanmaz.
          </p>
          <div className="py-6">
            <PaymentLogos variant="footer" />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Yasal Belgeler</h2>
          <ul className="text-sm space-y-1">
            <li><a href="/gizlilik" className="text-primary hover:underline">Gizlilik Sözleşmesi</a></li>
            <li><a href="/teslimat-iade" className="text-primary hover:underline">Teslimat ve İade Şartları</a></li>
            <li><a href="/mesafeli-satis" className="text-primary hover:underline">Mesafeli Satış Sözleşmesi</a></li>
            <li><a href="/odeme-guvenligi" className="text-primary hover:underline">Ödeme Güvenliği</a></li>
          </ul>
        </section>
      </div>
    </MarketingPageShell>
  )
}
