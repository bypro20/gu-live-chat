import { LegalLayout } from "@/components/legal-layout";
import { SITE } from "@/lib/site";

export default function AboutPage() {
  return (
    <LegalLayout title="Hakkımızda">
      <p>
        <strong>{SITE.legalName}</strong>, 2024 yılından bu yana sosyal medya hesaplarının
        büyümesi, içerik stratejisi ve dijital görünürlük hizmetleri sunan lisanslı bir
        online platformdur.
      </p>

      <h2 className="text-lg font-semibold text-white">Kurumsal Bilgiler</h2>
      <ul className="space-y-1">
        <li><strong>Ticaret Unvanı:</strong> {SITE.legalName}</li>
        <li><strong>Merkez Adres:</strong> {SITE.address}</li>
        <li><strong>MERSİS No:</strong> {SITE.mersis}</li>
        <li><strong>Vergi Dairesi:</strong> {SITE.taxOffice}</li>
        <li><strong>Vergi No:</strong> {SITE.taxNo}</li>
        <li><strong>E-posta:</strong> {SITE.email}</li>
        <li><strong>Telefon:</strong> {SITE.phone}</li>
        <li><strong>Web:</strong> {SITE.url}</li>
      </ul>

      <h2 className="text-lg font-semibold text-white">Hizmetlerimiz</h2>
      <p>
        Instagram, TikTok, YouTube ve diğer platformlarda takipçi, beğeni, izlenme ve
        etkileşim hizmetleri sunuyoruz. Tüm siparişler güvenli ödeme altyapısı (iyzico,
        3D Secure, SSL) ile işlenir.
      </p>

      <h2 className="text-lg font-semibold text-white">Güvenlik ve Ödeme</h2>
      <p>
        Kredi kartı bilgileriniz tarafımızca saklanmaz. Ödemeler iyzico güvenli ödeme
        altyapısı üzerinden 256-bit SSL şifreleme ile gerçekleştirilir.
      </p>
      <h2 className="text-lg font-semibold text-white">Müşteri Desteği</h2>
      <p>
        {SITE.workingHours} — Sipariş öncesi ve sonrası tüm sorularınız için{" "}
        {SITE.email} adresinden bize ulaşabilirsiniz.
      </p>
    </LegalLayout>
  );
}
