"use client";

import { useEffect, useState } from "react";
import type { SmmProvider, SmmService } from "@/lib/smm-api";

const PROVIDERS: { id: SmmProvider; label: string }[] = [
  { id: "moresmm", label: "MoreSMM" },
  { id: "jap", label: "JustAnotherPanel" },
];

export function SmmPanel() {
  const [provider, setProvider] = useState<SmmProvider>("moresmm");
  const [balance, setBalance] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [services, setServices] = useState<SmmService[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [bRes, sRes] = await Promise.all([
          fetch(`/api/smm/balance?provider=${provider}`),
          fetch(`/api/smm/services?provider=${provider}`),
        ]);
        const b = await bRes.json();
        const s = await sRes.json();
        if (!bRes.ok) throw new Error(b.error);
        if (!sRes.ok) throw new Error(s.error);
        setBalance(b.balance);
        setCurrency(b.currency);
        setServices(s);
      } catch (e) {
        setError(String(e));
        setBalance(null);
        setServices([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [provider]);

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProvider(p.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              provider === p.id
                ? "bg-violet-600 text-white"
                : "border border-white/15 text-zinc-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-zinc-400">Yükleniyor...</p>}
      {error && <div className="card text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          <div className="card inline-block">
            <p className="text-sm text-zinc-500">Bakiye ({provider})</p>
            <p className="text-3xl font-bold text-green-400">
              {balance} {currency}
            </p>
          </div>

          <div>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Servis ara (instagram, twitter...)"
              className="input mb-4 max-w-md"
            />
            <div className="card max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#0a0a12]">
                  <tr className="text-zinc-500">
                    <th className="pb-2 pr-3">ID</th>
                    <th className="pb-2 pr-3">Servis</th>
                    <th className="pb-2 pr-3">Kategori</th>
                    <th className="pb-2 pr-3">Fiyat</th>
                    <th className="pb-2 pr-3">Min-Max</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((s) => (
                    <tr key={s.service} className="border-t border-white/5 text-zinc-300">
                      <td className="py-2 pr-3 font-mono text-violet-400">{s.service}</td>
                      <td className="py-2 pr-3">{s.name}</td>
                      <td className="py-2 pr-3 text-zinc-500">{s.category}</td>
                      <td className="py-2 pr-3">${s.rate}</td>
                      <td className="py-2 pr-3">{s.min}-{s.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
