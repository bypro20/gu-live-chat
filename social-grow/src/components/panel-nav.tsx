"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { SITE } from "@/lib/site";

export function PanelNav({ session }: { session: SessionUser }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-white/10 bg-[#0a0a12]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/panel" className="font-bold text-white">
          {SITE.name}<span className="text-violet-400"> Panel</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-zinc-400 sm:inline">{session.name}</span>
          {session.role === "ADMIN" && (
            <>
              <Link href="/panel/siparisler" className="text-sm text-zinc-300 hover:text-white">Siparişler</Link>
              <Link href="/panel/bayiler" className="text-sm text-zinc-300 hover:text-white">Bayiler</Link>
              <Link href="/panel/telafi" className="text-sm text-zinc-300 hover:text-white">Telafi</Link>
              <Link href="/panel/smm" className="text-sm text-zinc-300 hover:text-white">SMM API</Link>
              <Link href="/panel/paketler" className="text-sm text-zinc-300 hover:text-white">Paketler</Link>
              <Link href="/panel/servisler" className="text-sm text-zinc-300 hover:text-white">Servisler</Link>
            </>
          )}
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">Site</Link>
          <button onClick={logout} className="text-sm text-zinc-400 hover:text-white">Çıkış</button>
        </div>
      </div>
    </header>
  );
}
