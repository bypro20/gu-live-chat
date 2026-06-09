import Link from "next/link";
import { SITE } from "@/lib/site";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/paketler", label: "Hizmetler" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a12]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="rounded bg-violet-600 px-2 py-0.5 text-sm">{SITE.shortName}</span>
          {SITE.name}
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-zinc-300 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/giris" className="text-sm text-zinc-300 hover:text-white">Giriş</Link>
          <Link href="/paketler" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
            Satın Al
          </Link>
        </div>
      </div>
    </header>
  );
}
