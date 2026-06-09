import { LegalLayout } from "@/components/legal-layout";
import { SITE } from "@/lib/site";

export default function DeliveryReturnPage() {
  return (
    <LegalLayout title="Teslimat ve İade Şartları">
      <h2 className="text-lg font-semibold text-white">1. Teslimat</h2>
      <p>
        {SITE.name} üzerinden satın alınan dijital hizmetler, ödeme onayından sonra
        elektronik ortamda sunulur. Hizmetlerin büyük bölümü 0–24 saat içinde işleme
        alınır; paket büyüklüğüne göre teslimat kademeli tamamlanabilir.
      </p>
      <p>
        Sipariş durumunuzu e-posta bildirimi veya müşteri paneli üzerinden takip
        edebilirsiniz.
      </p>

      <h2 className="text-lg font-semibold text-white">2. İade Koşulları</h2>
      <p>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler
        Yönetmeliği uyarınca, elektronik ortamda anında ifa edilen dijital hizmetlerde
        cayma hakkı, hizmet ifasına başlandıktan sonra tüketici onayı ile sona erer.
      </p>
      <p>
        Hizmet henüz başlamamışsa ve teknik bir nedenle teslimat yapılamıyorsa,
        {SITE.email} adresine başvurarak iade talebinde bulunabilirsiniz.
      </p>

      <h2 className="text-lg font-semibold text-white">3. Telafi (Garanti)</h2>
      <p>
        Belirli paketlerde telafi garantisi sunulmaktadır. Telafi talepleri, sipariş
        numarası ile birlikte destek ekibimize iletilmelidir. Garanti kapsamı paket
        açıklamasında belirtilen süre ile sınırlıdır.
      </p>

      <h2 className="text-lg font-semibold text-white">4. İletişim</h2>
      <p>
        Teslimat ve iade ile ilgili tüm talepler için: {SITE.email} — {SITE.phone}
      </p>
    </LegalLayout>
  );
}
