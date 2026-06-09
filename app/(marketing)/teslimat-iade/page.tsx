import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { SITE_LEGAL } from '@/lib/site-legal'

export const metadata = {
  title: 'Teslimat ve İade Şartları',
  description: 'Gu Chat dijital hizmet teslimat ve iade koşulları.',
}

export default function TeslimatIadePage() {
  return (
    <MarketingPageShell>
      <div className="mb-10">
        <p className="section-label mb-4">Yasal</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Teslimat ve İade Şartları</h1>
        <p className="mt-4 text-sm text-muted-foreground">Son güncelleme: 2026</p>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Satıcı Bilgileri</h2>
          <p className="text-sm">
            {SITE_LEGAL.legalName} · {SITE_LEGAL.address}
            <br />
            {SITE_LEGAL.email} · {SITE_LEGAL.phone}
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Teslimat</h2>
          <p>
            {SITE_LEGAL.name} üzerinden satın alınan abonelik ve dijital hizmetler, ödeme onayından
            sonra elektronik ortamda hesabınıza tanımlanır. Erişim genellikle birkaç dakika içinde
            aktif hale gelir.
          </p>
          <p className="mt-2">
            Hizmet durumunuzu kontrol panelinizden ve e-posta bildirimlerinden takip edebilirsiniz.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. İade Koşulları</h2>
          <p>
            6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
            uyarınca, elektronik ortamda anında ifa edilen dijital hizmetlerde cayma hakkı,
            hizmet ifasına başlandıktan ve tüketici onayı alındıktan sonra sona erer.
          </p>
          <p className="mt-2">
            Hizmet henüz başlamamışsa veya teknik nedenle erişim sağlanamıyorsa{' '}
            <a href={`mailto:${SITE_LEGAL.email}`} className="text-primary hover:underline">
              {SITE_LEGAL.email}
            </a>{' '}
            adresine başvurarak iade talebinde bulunabilirsiniz.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Abonelik İptali</h2>
          <p>
            Aylık veya yıllık aboneliklerinizi panel üzerinden dönem sonuna kadar iptal
            edebilirsiniz. Kullanılmayan süre için kısmi iade politikası paket koşullarında
            belirtilir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. İletişim</h2>
          <p>
            Teslimat ve iade talepleri: {SITE_LEGAL.email} — {SITE_LEGAL.phone}
          </p>
        </section>
      </div>
    </MarketingPageShell>
  )
}
