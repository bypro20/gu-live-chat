import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ResellerForm } from "@/components/reseller-form";

const perks = [
  "Kendi referans linkin",
  "Bayi paneli (sipariş, komisyon, müşteri)",
  "%20-40 komisyon oranı",
  "White-label: kendi ajans adınla sat",
  "Hazır paketler ve fiyat listesi",
  "Eğitim ve destek",
];

export default function BayilikPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">Bayilik Programı</h1>
          <p className="mx-auto max-w-2xl text-zinc-400">
            Kendi sosyal medya ajansını kur. Müşteri getir, komisyon kazan.
            Teknik altyapı hazır — sen satışa odaklan.
          </p>
        </div>

        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <div className="card">
            <h2 className="mb-6 text-xl font-bold text-white">Bayiye ne veriyoruz?</h2>
            <ul className="space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex gap-2 text-zinc-300">
                  <span className="text-violet-400">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="card border-violet-500/30">
            <h2 className="mb-4 text-xl font-bold text-white">Nasıl çalışır?</h2>
            <ol className="space-y-4 text-zinc-300">
              <li><strong className="text-white">1.</strong> Başvuru yap, onaylan</li>
              <li><strong className="text-white">2.</strong> Panelden referans linkini al</li>
              <li><strong className="text-white">3.</strong> Müşteriye paket sat</li>
              <li><strong className="text-white">4.</strong> Komisyonunu panelden takip et</li>
            </ol>
            <p className="mt-6 text-sm text-zinc-500">
              Örnek link: prmdia.com/paketler?ref=SENIN123
            </p>
          </div>
        </div>

        <ResellerForm />
      </main>
      <Footer />
    </div>
  );
}
