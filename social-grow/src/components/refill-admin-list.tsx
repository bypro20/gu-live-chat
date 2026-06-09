"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statusLabels: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
};

export function RefillAdminList({
  requests,
}: {
  requests: Array<{
    id: string;
    orderCode: string;
    username: string;
    note: string | null;
    status: string;
    createdAt: string;
  }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function update(id: string, status: string) {
    setBusy(id);
    await fetch("/api/refill", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    router.refresh();
  }

  if (requests.length === 0) {
    return <p className="text-zinc-500">Bekleyen telafi talebi yok.</p>;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-zinc-500">
            <th className="pb-3 pr-4">Sipariş</th>
            <th className="pb-3 pr-4">Kullanıcı</th>
            <th className="pb-3 pr-4">Not</th>
            <th className="pb-3 pr-4">Durum</th>
            <th className="pb-3">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-t border-white/10 text-zinc-300">
              <td className="py-3 pr-4 font-mono text-xs">{r.orderCode}</td>
              <td className="py-3 pr-4">{r.username}</td>
              <td className="py-3 pr-4 text-xs text-zinc-500">{r.note || "—"}</td>
              <td className="py-3 pr-4">{statusLabels[r.status] || r.status}</td>
              <td className="py-3 space-x-2">
                {r.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => update(r.id, "APPROVED")}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => update(r.id, "REJECTED")}
                      className="rounded bg-red-600/80 px-2 py-1 text-xs text-white"
                    >
                      Reddet
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
