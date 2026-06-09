"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SmmProvider } from "@/lib/smm-api";

function normalizeLink(target?: string | null, platform?: string): string {
  if (!target) return "";
  if (target.startsWith("http")) return target;
  const handle = target.replace("@", "");
  if (platform === "YOUTUBE") return `https://youtube.com/@${handle}`;
  if (platform === "TIKTOK") return `https://tiktok.com/@${handle}`;
  if (platform === "TWITTER") return `https://x.com/${handle}`;
  return `https://instagram.com/${handle}`;
}

export function SmmSendForm({
  orderId,
  targetLink,
  platform,
  defaultProvider,
  defaultServiceId,
  defaultQuantity,
}: {
  orderId: string;
  targetLink?: string | null;
  platform?: string;
  defaultProvider?: string | null;
  defaultServiceId?: number | null;
  defaultQuantity?: number | null;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState<SmmProvider>(
    (defaultProvider as SmmProvider) || "moresmm"
  );
  const [serviceId, setServiceId] = useState(
    defaultServiceId ? String(defaultServiceId) : ""
  );
  const [link, setLink] = useState(normalizeLink(targetLink, platform));
  const [quantity, setQuantity] = useState(
    defaultQuantity ? String(defaultQuantity) : "100"
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/smm/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, serviceId, link, quantity, provider }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "Hata");
      return;
    }
    setMsg(`${provider} sipariş #${data.smmOrderId} gönderildi`);
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
      <p className="text-xs font-medium text-violet-300">SMM API ile gönder</p>
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value as SmmProvider)}
        className="input text-xs"
      >
        <option value="moresmm">MoreSMM</option>
        <option value="jap">JustAnotherPanel</option>
      </select>
      <input
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        placeholder="Servis ID"
        className="input text-xs"
      />
      <input
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Link (profil/gönderi)"
        className="input text-xs"
      />
      <input
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Adet"
        className="input text-xs"
      />
      <button
        type="button"
        onClick={send}
        disabled={loading}
        className="rounded-lg bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-500"
      >
        {loading ? "..." : "API ile Gönder"}
      </button>
      {msg && <p className="text-xs text-zinc-400">{msg}</p>}
    </div>
  );
}
