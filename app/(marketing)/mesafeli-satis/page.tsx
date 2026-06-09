import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { SITE_LEGAL } from '@/lib/site-legal'

export const metadata = {
  title: 'Mesafeli Satış Sözleşmesi',
  description: 'Gu Chat mesafeli satış sözleşmesi ve tüketici hakları.',
}

export default function MesafeliSatisPage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Yasal</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Mesafeli Satış Sözleşmesi</h1>
        <p className="mt-4 text-sm text-muted-foreground">Son güncelleme: 2026</p>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Taraflar</h2>
          <p>
            <strong className="text-foreground">Satıcı:</strong> {SITE_LEGAL.legalName}
            <br />
            E-posta: {SITE_LEGAL.email}
            <br />
            Telefon: {SITE_LEGAL.phone}
            <br />
            Adres: {SITE_LEGAL.address}
            <br />
            MERSİS: {SITE_LEGAL.mersis}
            <br />
            Vergi Dairesi: {SITE_LEGAL.taxOffice} — Vergi No: {SITE_LEGAL.taxNo}
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Alıcı:</strong> Kayıt veya ödeme sırasında bilgileri
            verilen gerçek veya tüzel kişi.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Konu</h2>
          <p>
            İşbu sözleşme, Alıcı&apos;nın {SITE_LEGAL.url} üzerinden elektronik ortamda satın aldığı
            {SITE_LEGAL.name} abonelik ve dijital hizmetlerine ilişkin tarafların hak ve
            yükümlülüklerini düzenler.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Hizmet ve Fiyat</h2>
          <p>
            Hizmet kapsamı ve bedel, sipariş / abonelik sırasında sitede gösterilen tutardır.
            Fiyatlara KDV dahildir (aksi belirtilmedikçe).
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Ödeme</h2>
          <p>
            Ödeme, iyzico güvenli ödeme altyapısı ile Visa / MasterCard kredi veya banka kartı
            üzerinden, 256-bit SSL korumalı bağlantı ile alınır. Ödeme onayından sonra hizmet
            ifasına başlanır. Kart bilgileri satıcı tarafından saklanmaz.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Teslimat</h2>
          <p>
            Dijital hizmetler elektronik ortamda ifa edilir. Hesap erişimi ödeme onayından sonra
            sağlanır.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Cayma Hakkı</h2>
          <p>
            Dijital içerik ve anında ifa edilen hizmetlerde, hizmet ifasına başlanması ile cayma
            hakkı tüketici onayı ile sona erer. Detaylar için{' '}
            <a href="/teslimat-iade" className="text-primary hover:underline">
              Teslimat ve İade Şartları
            </a>{' '}
            sayfasına bakınız.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Uyuşmazlık</h2>
          <p>
            Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. Şikayet
            ve itirazlar için {SITE_LEGAL.email} adresine başvurabilirsiniz.
          </p>
        </section>
      </div>
    </MarketingPageShell>
  )
}
