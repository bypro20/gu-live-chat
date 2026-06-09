"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PackageRow = {
  id: string;
  name: string;
  slug: string;
  platform: string;
  price: number;
  smmProvider: string | null;
  smmServiceId: number | null;
  smmQuantity: number | null;
  isActive: boolean;
};

export function PackageSmmEditor({ packages }: { packages: PackageRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function save(id: string, form: HTMLFormElement) {
    setBusy(id);
    const fd = new FormData(form);
    await fetch(`/api/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smmProvider: fd.get("provider") || null,
        smmServiceId: fd.get("serviceId") || null,
        smmQuantity: fd.get("quantity") || null,
        isActive: fd.get("active") === "on",
      }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {packages.map((pkg) => (
        <form
          key={pkg.id}
          onSubmit={(e) => {
            e.preventDefault();
            save(pkg.id, e.currentTarget);
          }}
          className="card space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-white">{pkg.name}</p>
              <p className="text-xs text-zinc-500">
                {pkg.platform} · ₺{pkg.price} · {pkg.slug}
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                name="active"
                type="checkbox"
                defaultChecked={pkg.isActive}
              />
              Satışta
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              name="provider"
              defaultValue={pkg.smmProvider || ""}
              className="input text-sm"
            >
              <option value="">Panel seçin</option>
              <option value="moresmm">MoreSMM</option>
              <option value="jap">JustAnotherPanel</option>
            </select>
            <input
              name="serviceId"
              defaultValue={pkg.smmServiceId ?? ""}
              placeholder="SMM Servis ID"
              className="input text-sm"
            />
            <input
              name="quantity"
              defaultValue={pkg.smmQuantity ?? ""}
              placeholder="Adet (boş = paket adından)"
              className="input text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy === pkg.id}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {busy === pkg.id ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      ))}
    </div>
  );
}
