import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="card">
          <p className="text-4xl">✕</p>
          <h1 className="mt-4 text-2xl font-bold text-red-400">Ödeme Başarısız</h1>
          <p className="mt-3 text-zinc-400">
            Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz.
          </p>
          {code && (
            <p className="mt-4 text-sm text-zinc-500">Referans: {code}</p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/paketler#siparis" className="btn-primary">
              Tekrar Dene
            </Link>
            <Link href="/iletisim" className="btn-secondary">
              Destek Al
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
