import Link from "next/link";
import { SITE } from "@/lib/site";

export function TopBar() {
  return (
    <div className="border-b border-white/5 bg-[#06060f] py-1.5 text-xs text-zinc-500">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <Link href="/iletisim" className="hover:text-violet-400">İletişim</Link>
        <div className="flex gap-4">
          <Link href="/telafi-talebi" className="hover:text-violet-400">Telafi Talebi</Link>
          <span>|</span>
          <Link href="/siparis-sorgula" className="hover:text-violet-400">Sipariş Sorgula</Link>
        </div>
      </div>
    </div>
  );
}
