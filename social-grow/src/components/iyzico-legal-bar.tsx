import Link from "next/link";

/** iyzico başvurusu için zorunlu yasal sayfa linkleri */
export const IYZICO_REQUIRED_LINKS = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/gizlilik", label: "Gizlilik Sözleşmesi" },
  { href: "/teslimat-iade", label: "Teslimat ve İade Şartları" },
  { href: "/mesafeli-satis", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/odeme-guvenligi", label: "Ödeme Güvenliği" },
] as const;

export function IyzicoLegalBar() {
  return (
    <nav
      aria-label="Yasal sayfalar"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm"
    >
      {IYZICO_REQUIRED_LINKS.map((link, i) => (
        <span key={link.href} className="flex items-center gap-4">
          {i > 0 && <span className="hidden text-white/20 sm:inline">|</span>}
          <Link
            href={link.href}
            className="text-zinc-400 transition hover:text-violet-400"
          >
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
