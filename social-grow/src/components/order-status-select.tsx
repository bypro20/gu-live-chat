"use client";

import { useRouter } from "next/navigation";

const statuses = [
  "PENDING",
  "PAID",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
];

const labels: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  ACTIVE: "İşlemde",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
  FAILED: "Başarısız",
};

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();

  async function change(e: React.ChangeEvent<HTMLSelectElement>) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.target.value }),
    });
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={change}
      className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{labels[s] || s}</option>
      ))}
    </select>
  );
}
