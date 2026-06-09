"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ResellerRow = {
  id: string;
  agencyName: string;
  email: string;
  referralCode: string;
  commissionRate: number;
  totalEarnings: number;
  orderCount: number;
  isActive: boolean;
};

export function ResellerAdminRow({ reseller }: { reseller: ResellerRow }) {
  const router = useRouter();
  const [rate, setRate] = useState(String(reseller.commissionRate));
  const [active, setActive] = useState(reseller.isActive);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/resellers/${reseller.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isActive: active,
        commissionRate: Number(rate),
      }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <tr className="border-t border-white/10 text-zinc-300">
      <td className="py-3 pr-4">{reseller.agencyName}</td>
      <td className="py-3 pr-4">{reseller.email}</td>
      <td className="py-3 pr-4 font-mono text-violet-400">{reseller.referralCode}</td>
      <td className="py-3 pr-4">
        <input
          type="number"
          min={0}
          max={80}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
        />
      </td>
      <td className="py-3 pr-4 text-green-400">₺{reseller.totalEarnings.toLocaleString("tr-TR")}</td>
      <td className="py-3 pr-4">{reseller.orderCount}</td>
      <td className="py-3 pr-4">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Aktif
        </label>
      </td>
      <td className="py-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded bg-violet-600 px-2 py-1 text-xs text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? "..." : "Kaydet"}
        </button>
      </td>
    </tr>
  );
}
