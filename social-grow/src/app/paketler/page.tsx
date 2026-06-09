import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { PackageCard } from "@/components/package-card";
import { OrderForm } from "@/components/order-form";
import { PaymentLogos } from "@/components/payment-logos";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  const { platform } = await searchParams;

  const packages = await prisma.package.findMany({
    where: {
      isActive: true,
      ...(platform ? { platform: platform.toUpperCase() } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });

  const platforms = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "TWITTER"];

  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="mb-4 text-center text-4xl font-bold text-white">
          Sosyal Medya Hizmetlerimiz
        </h1>
        <p className="mb-4 text-center text-zinc-400">
          Fiyatlar KDV dahildir. iyzico güvenli ödeme ile anında satın alın.
        </p>
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          <a
            href="/paketler"
            className={`rounded-full px-4 py-1.5 text-sm ${
              !platform
                ? "bg-violet-600 text-white"
                : "border border-white/15 text-zinc-400 hover:text-white"
            }`}
          >
            Tümü
          </a>
          {platforms.map((p) => (
            <a
              key={p}
              href={`/paketler?platform=${p}`}
              className={`rounded-full px-4 py-1.5 text-sm ${
                platform?.toUpperCase() === p
                  ? "bg-violet-600 text-white"
                  : "border border-white/15 text-zinc-400 hover:text-white"
              }`}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </a>
          ))}
        </div>

        {packages.length === 0 ? (
          <p className="text-center text-zinc-500">Bu kategoride paket bulunamadı.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}

        <div className="mt-16">
          <OrderForm packages={packages.length ? packages : await prisma.package.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })} />
        </div>

        <div className="mt-12 flex justify-center">
          <PaymentLogos variant="footer" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
