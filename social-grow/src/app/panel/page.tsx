import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PanelNav } from "@/components/panel-nav";
import { getProviderList } from "@/lib/smm-api";
import { isIyzicoConfigured } from "@/lib/iyzico";

export default async function PanelPage() {
  const session = await getSession();
  if (!session) redirect("/giris");

  if (session.role === "ADMIN") {
    const [orders, resellers, leads, pendingRefills, smmProviders] = await Promise.all([
      prisma.order.count(),
      prisma.resellerProfile.count(),
      prisma.lead.count(),
      prisma.refillRequest.count({ where: { status: "PENDING" } }),
      Promise.resolve(getProviderList()),
    ]);
    const pending = await prisma.order.count({ where: { status: "PENDING" } });
    const revenue = await prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { amount: true },
    });
    const paidOrders = await prisma.order.count({ where: { paymentStatus: "PAID" } });

    return (
      <div className="min-h-screen bg-[#06060f]">
        <PanelNav session={session} />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-2 text-2xl font-bold text-white">Admin Paneli</h1>
          <p className="mb-8 text-sm text-zinc-500">ProMedia yönetim merkezi</p>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Toplam Sipariş" value={String(orders)} />
            <StatCard label="Ödenen Sipariş" value={String(paidOrders)} />
            <StatCard label="Bekleyen Ödeme" value={String(pending)} />
            <StatCard label="Net Ciro" value={`₺${(revenue._sum.amount || 0).toLocaleString("tr-TR")}`} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <StatCard label="Bayi Sayısı" value={String(resellers)} />
            <StatCard label="Leads" value={String(leads)} />
            <StatCard label="Telafi Bekleyen" value={String(pendingRefills)} />
          </div>

          <div className="card mt-8">
            <h2 className="mb-4 text-sm font-semibold text-white">Servis Durumu</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <ServiceBadge label="iyzico Ödeme" active={isIyzicoConfigured()} />
              {smmProviders.map((p) => (
                <ServiceBadge key={p.id} label={p.name} active={p.configured} />
              ))}
              <ServiceBadge
                label="Otomatik SMM"
                active={process.env.AUTO_SMM_FULFILL === "true"}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/panel/siparisler" className="btn-primary">Siparişler</Link>
            <Link href="/panel/bayiler" className="btn-secondary">Bayiler</Link>
            <Link href="/panel/leads" className="btn-secondary">Leads ({leads})</Link>
            <Link href="/panel/telafi" className="btn-secondary">Telafi ({pendingRefills})</Link>
            <Link href="/panel/smm" className="btn-secondary">SMM API</Link>
            <Link href="/panel/paketler" className="btn-secondary">Paket Eşleme</Link>
            <Link href="/panel/servisler" className="btn-secondary">Servis Kurulumu</Link>
          </div>
        </main>
      </div>
    );
  }

  const reseller = await prisma.resellerProfile.findFirst({
    where: { userId: session.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 10, include: { package: true } },
      _count: { select: { orders: true } },
    },
  });
  if (!reseller) redirect("/giris");

  const refLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/paketler?ref=${reseller.referralCode}`;

  return (
    <div className="min-h-screen bg-[#06060f]">
      <PanelNav session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white">{reseller.agencyName}</h1>
        <p className="mb-8 text-zinc-400">Bayi Paneli — %{reseller.commissionRate} komisyon</p>

        <div className="card mb-8">
          <p className="mb-2 text-sm text-zinc-400">Referans linkin (müşteriye bunu gönder):</p>
          <code className="block break-all rounded-lg bg-black/40 p-3 text-violet-300">{refLink}</code>
          <p className="mt-2 text-xs text-zinc-500">Kod: {reseller.referralCode}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Toplam Kazanç" value={`₺${reseller.totalEarnings.toLocaleString("tr-TR")}`} />
          <StatCard label="Siparişlerim" value={String(reseller._count.orders)} />
          <StatCard label="Komisyon Oranı" value={`%${reseller.commissionRate}`} />
        </div>

        <h2 className="mb-4 mt-8 text-lg font-semibold text-white">Son Siparişler</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="pb-3">Müşteri</th>
                <th className="pb-3">Paket</th>
                <th className="pb-3">Komisyon</th>
                <th className="pb-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {reseller.orders.map((o) => (
                <tr key={o.id} className="border-t border-white/10 text-zinc-300">
                  <td className="py-3">{o.customerName}</td>
                  <td className="py-3">{o.package.name}</td>
                  <td className="py-3 text-green-400">₺{o.commission.toLocaleString("tr-TR")}</td>
                  <td className="py-3">{o.status}</td>
                </tr>
              ))}
              {reseller.orders.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-zinc-500">Henüz sipariş yok — linkini paylaş!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ServiceBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
      <span className="text-zinc-300">{label}</span>
      <span className={active ? "text-green-400" : "text-amber-400"}>
        {active ? "Aktif" : "Kapalı"}
      </span>
    </div>
  );
}
