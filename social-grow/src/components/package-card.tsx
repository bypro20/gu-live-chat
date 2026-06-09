import Link from "next/link";
import type { Package } from "@/generated/prisma/client";

export function PackageCard({ pkg }: { pkg: Package }) {
  const features: string[] = JSON.parse(pkg.features);

  return (
    <div
      className={`card relative flex flex-col ${
        pkg.isPopular ? "border-violet-500/50 ring-1 ring-violet-500/30" : ""
      }`}
    >
      {pkg.isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white">
          En Popüler
        </span>
      )}
      <div className="mb-2 flex gap-2">
        {pkg.tag && (
          <span className="rounded bg-violet-600/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
            {pkg.tag}
          </span>
        )}
        <span className="text-[10px] text-zinc-500">{pkg.platform}</span>
      </div>
      <h2 className="text-lg font-bold text-white">{pkg.name}</h2>
      <p className="mt-1 text-sm text-zinc-400">{pkg.description}</p>
      <p className="my-4 text-3xl font-bold text-violet-400">
        ₺{pkg.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
      </p>
      <ul className="mb-6 flex-1 space-y-2 text-sm text-zinc-300">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-violet-400">✓</span> {f}
          </li>
        ))}
      </ul>
      <Link
        href={`/paketler/${pkg.slug}`}
        className="btn-primary text-center text-sm"
      >
        Satın Al — ₺{pkg.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
      </Link>
    </div>
  );
}
