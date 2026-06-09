import { LegalLayout } from "@/components/legal-layout";
import { SITE } from "@/lib/site";

export default function DistanceSalesPage() {
  return (
    <LegalLayout title="Mesafeli Satış Sözleşmesi">
      <h2 className="text-lg font-semibold text-white">1. Taraflar</h2>
      <p>
        <strong>Satıcı:</strong> {SITE.legalName}
        <br />
        E-posta: {SITE.email}
        <br />
        Telefon: {SITE.phone}
        <br />
        Adres: {SITE.address}
        <br />
        MERSİS: {SITE.mersis}
        <br />
        Vergi Dairesi: {SITE.taxOffice} — Vergi No: {SITE.taxNo}
      </p>
      <p>
        <strong>Alıcı:</strong> Sipariş formunda belirtilen gerçek veya tüzel kişi.
      </p>

      <h2 className="text-lg font-semibold text-white">2. Konu</h2>
      <p>
        İşbu sözleşme, Alıcı&apos;nın {SITE.url} üzerinden elektronik ortamda sipariş
        verdiği dijital sosyal medya hizmetlerinin satışına ilişkin tarafların hak ve
        yükümlülüklerini düzenler.
      </p>

      <h2 className="text-lg font-semibold text-white">3. Ürün/Hizmet ve Fiyat</h2>
      <p>
        Hizmet türü, miktarı ve bedeli sipariş sırasında sitede gösterilen tutardır.
        Fiyatlara KDV dahildir (aksi belirtilmedikçe).
      </p>

      <h2 className="text-lg font-semibold text-white">4. Ödeme</h2>
      <p>
        Ödeme, iyzico güvenli ödeme altyapısı ile kredi/banka kartı veya belirtilen
        diğer yöntemlerle alınır. Ödeme onayından sonra hizmet ifasına başlanır.
      </p>

      <h2 className="text-lg font-semibold text-white">5. Teslimat</h2>
      <p>
        Dijital hizmetler elektronik ortamda ifa edilir. Teslimat süreleri paket
        açıklamasında belirtilir.
      </p>

      <h2 className="text-lg font-semibold text-white">6. Cayma Hakkı</h2>
      <p>
        Elektronik ortamda anında ifa edilen hizmetlerde, Alıcı&apos;nın onayı ile
        cayma hakkı sona erer. Detaylar için{" "}
        <a href="/teslimat-iade" className="text-violet-400 hover:underline">
          Teslimat ve İade Şartları
        </a>{" "}
        sayfasına bakınız.
      </p>

      <h2 className="text-lg font-semibold text-white">7. Uyuşmazlık</h2>
      <p>
        Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
        Şikayetler için: {SITE.email}
      </p>

      <p className="text-zinc-500">
        Sipariş veren Alıcı, işbu sözleşmeyi elektronik ortamda okuduğunu ve kabul
        ettiğini beyan eder.
      </p>
    </LegalLayout>
  );
}
