"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookies_ok")) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0a0a12] p-4 shadow-2xl">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 md:flex-row">
        <p className="text-center text-xs text-zinc-400 md:text-left">
          Sitemizde deneyiminizi iyileştirmek için çerezler kullanıyoruz.{" "}
          <Link href="/gizlilik" className="text-violet-400 hover:underline">
            Gizlilik Sözleşmesi
          </Link>
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("cookies_ok", "1");
            setShow(false);
          }}
          className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white"
        >
          Kabul Et
        </button>
      </div>
    </div>
  );
}
