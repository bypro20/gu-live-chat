import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { OrderForm } from "@/components/order-form";
import { PaymentLogos } from "@/components/payment-logos";
import { prisma } from "@/lib/prisma";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const pkg = await prisma.package.findFirst({
    where: { slug, isActive: true },
  });
  if (!pkg) notFound();

  const allPackages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const features: string[] = JSON.parse(pkg.features);

  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <Link href="/paketler" className="text-sm text-violet-400 hover:underline">
          ← Tüm paketler
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="card">
            <div className="mb-3 flex gap-2">
              {pkg.tag && (
                <span className="rounded bg-violet-600/30 px-2 py-0.5 text-xs font-bold text-violet-300">
                  {pkg.tag}
                </span>
              )}
              <span className="text-xs text-zinc-500">{pkg.platform} · {pkg.category}</span>
            </div>
            <h1 className="text-3xl font-bold text-white">{pkg.name}</h1>
            <p className="mt-3 text-zinc-400">{pkg.description}</p>
            <p className="my-6 text-4xl font-bold text-violet-400">
              ₺{pkg.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              {features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-violet-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <PaymentLogos variant="checkout" />
            </div>
          </div>

          <div>
            <OrderForm packages={allPackages} preselectedSlug={pkg.slug} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
