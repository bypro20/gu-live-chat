import Link from "next/link";
import { PaymentLogos } from "@/components/payment-logos";
import { IyzicoLegalBar } from "@/components/iyzico-legal-bar";
import { SITE } from "@/lib/site";

const services = [
  { href: "/paketler?platform=INSTAGRAM", label: "Instagram" },
  { href: "/paketler?platform=TIKTOK", label: "TikTok" },
  { href: "/paketler?platform=YOUTUBE", label: "YouTube" },
  { href: "/paketler?platform=TWITTER", label: "Twitter" },
];

const legalLinks = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/gizlilik", label: "Gizlilik Sözleşmesi" },
  { href: "/teslimat-iade", label: "Teslimat ve İade Şartları" },
  { href: "/mesafeli-satis", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/odeme-guvenligi", label: "Ödeme Güvenliği" },
];

const support = [
  { href: "/siparis-sorgula", label: "Sipariş Sorgula" },
  { href: "/telafi-talebi", label: "Telafi Talebi" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/paketler", label: "Tüm Hizmetler" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080810] py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="mb-2 text-lg font-semibold text-white">{SITE.name}</p>
            <p className="text-sm text-zinc-500">{SITE.legalName}</p>
            <p className="mt-2 text-sm text-zinc-500">{SITE.address}</p>
            <p className="mt-2 text-sm text-zinc-500">
              {SITE.email} · {SITE.phone}
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-white">Hizmetler</p>
            {services.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block text-sm text-zinc-400 hover:text-violet-400"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-white">Yasal</p>
            {legalLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-sm text-zinc-400 hover:text-violet-400"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-white">Destek</p>
            {support.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-sm text-zinc-400 hover:text-violet-400"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6 border-t border-white/10 pt-8">
          <IyzicoLegalBar />
          <div className="flex justify-center">
            <PaymentLogos variant="footer" />
          </div>
          <p className="text-center text-xs text-zinc-600">
            {SITE.name} © {new Date().getFullYear()} — Tüm hakları saklıdır.
            <br />
            MERSİS: {SITE.mersis} · {SITE.taxOffice} · VKN: {SITE.taxNo}
          </p>
        </div>
      </div>
    </footer>
  );
}
