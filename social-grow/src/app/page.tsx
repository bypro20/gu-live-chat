import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { PackageCard } from "@/components/package-card";
import { PaymentLogos } from "@/components/payment-logos";
import { SITE } from "@/lib/site";
import { prisma } from "@/lib/prisma";

const why = [
  { title: "Güvenilir Ödeme", desc: "3D Secure, iyzico altyapısı. Kart bilgisi saklanmaz." },
  { title: "Hızlı Teslimat", desc: "Siparişler 0–15 dakikada başlar." },
  { title: "7/24 Destek", desc: "Canlı destek ekibimiz her an yanınızda." },
  { title: "Telafi Garantisi", desc: "30–90 gün telafi hakkı." },
];

const faqs = [
  {
    q: "Nasıl satın alırım?",
    a: "Paket seçin, bilgilerinizi girin ve iyzico güvenli ödeme ekranından kartınızla ödeme yapın.",
  },
  {
    q: "Şifre istenir mi?",
    a: "Hayır. Sadece hesap linki veya kullanıcı adı yeterlidir.",
  },
  {
    q: "Teslimat ne kadar sürer?",
    a: "Çoğu sipariş 0–15 dakikada başlar. Büyük paketler kademeli tamamlanır.",
  },
  {
    q: "İade ve telafi nasıl çalışır?",
    a: "Telafi Talebi sayfasından veya destek@prmdia.com üzerinden başvurabilirsiniz.",
  },
];

export const revalidate = 300;

export default async function HomePage() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 8,
  });

  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-2 text-sm text-violet-400">Dijital Sosyal Medya Hizmetleri</p>
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Instagram Takipçi Satın Al – Güvenli Ödeme
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-400">
            {SITE.name} ile takipçi, beğeni ve izlenme paketlerini iyzico güvenli ödeme
            altyapısı ile anında satın alın. Fiyatlar açık, teslimat hızlı.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/paketler" className="btn-primary">
              Paketleri Gör ve Satın Al
            </Link>
            <Link href="/hakkimizda" className="btn-secondary">
              Hakkımızda
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Satın Alınabilir Paketler</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Tüm fiyatlar KDV dahil · Anında ödeme · Hemen teslimat
              </p>
            </div>
            <Link href="/paketler" className="text-sm text-violet-400 hover:underline">
              Tümünü gör →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            Neden {SITE.name}?
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {why.map((w) => (
              <div key={w.title} className="card text-center">
                <h3 className="mb-2 font-semibold text-white">{w.title}</h3>
                <p className="text-sm text-zinc-400">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            Sık Sorulan Sorular
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-medium text-white">{f.q}</h3>
                <p className="mt-2 text-sm text-zinc-400">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 text-center">
          <div className="card">
            <h2 className="text-xl font-bold text-white">Hemen satın almaya başlayın</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Paket seçin, ödemenizi iyzico ile güvenle tamamlayın.
            </p>
            <Link href="/paketler#siparis" className="btn-primary mt-6 inline-block">
              Sipariş Ver
            </Link>
            <div className="mt-8 flex justify-center">
              <PaymentLogos variant="footer" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
