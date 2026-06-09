import { LegalLayout } from "@/components/legal-layout";
import { SITE } from "@/lib/site";

export default function PaymentSecurityPage() {
  return (
    <LegalLayout title="Ödeme Güvenliği">
      <p>
        {SITE.name} olarak müşterilerimizin ödeme güvenliğini en üst düzeyde tutuyoruz.
      </p>
      <ul className="list-inside list-disc space-y-2">
        <li>256-bit SSL sertifikası ile şifreli bağlantı</li>
        <li>iyzico güvenli ödeme altyapısı</li>
        <li>3D Secure doğrulama</li>
        <li>PCI-DSS uyumlu ödeme işleme (iyzico)</li>
        <li>Kart bilgileri sunucularımızda saklanmaz</li>
      </ul>
      <p className="text-zinc-500">
        Visa ve MasterCard ile güvenli ödeme yapabilirsiniz.
      </p>
    </LegalLayout>
  );
}
