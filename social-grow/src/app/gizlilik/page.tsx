import { LegalLayout } from "@/components/legal-layout";
import { SITE } from "@/lib/site";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Gizlilik Sözleşmesi (KVKK Aydınlatma Metni)">
      <p>
        {SITE.legalName} (&quot;{SITE.name}&quot;) olarak kişisel verilerinizin güvenliği
        hususuna azami hassasiyet göstermekteyiz. 6698 sayılı Kişisel Verilerin Korunması
        Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatıyla aşağıdaki bilgileri sunarız.
      </p>

      <h2 className="text-lg font-semibold text-white">1. Toplanan Veriler</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>Kimlik ve iletişim: ad, soyad, e-posta, telefon</li>
        <li>İşlem bilgileri: sipariş geçmişi, ödeme referansı (kart bilgisi saklanmaz)</li>
        <li>Teknik veriler: IP adresi, çerezler, tarayıcı bilgisi</li>
        <li>Sosyal medya kullanıcı adı (hizmet teslimi için)</li>
      </ul>

      <h2 className="text-lg font-semibold text-white">2. İşleme Amaçları</h2>
      <p>
        Siparişlerin alınması ve teslimi, müşteri desteği, yasal yükümlülüklerin yerine
        getirilmesi, ödeme güvenliği ve site güvenliğinin sağlanması.
      </p>

      <h2 className="text-lg font-semibold text-white">3. Ödeme Güvenliği</h2>
      <p>
        Kredi kartı ödemeleri iyzico altyapısı üzerinden, 256-bit SSL şifreleme ile
        gerçekleştirilir. {SITE.name} kredi kartı bilgilerinizi sunucularında saklamaz.
      </p>

      <h2 className="text-lg font-semibold text-white">4. Haklarınız</h2>
      <p>
        KVKK md. 11 kapsamında; verilerinize erişim, düzeltme, silme, işlemeyi kısıtlama
        ve itiraz haklarına sahipsiniz. Taleplerinizi {SITE.email} adresine iletebilirsiniz.
      </p>

      <h2 className="text-lg font-semibold text-white">5. Çerezler</h2>
      <p>
        Sitemiz, oturum yönetimi ve analitik amaçlı çerezler kullanabilir. Tarayıcı
        ayarlarınızdan çerezleri yönetebilirsiniz.
      </p>

      <h2 className="text-lg font-semibold text-white">6. İletişim</h2>
      <p>Veri Sorumlusu: {SITE.legalName} — {SITE.email}</p>
    </LegalLayout>
  );
}
