import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PanelNav } from "@/components/panel-nav";
import { ResellerAdminRow } from "@/components/reseller-admin-row";

export default async function ResellersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/panel");

  const resellers = await prisma.resellerProfile.findMany({
    include: { user: true, _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#06060f]">
      <PanelNav session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Bayiler</h1>
        <p className="mb-6 text-sm text-zinc-500">Komisyon oranı ve hesap onayı yönetimi</p>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="pb-3 pr-4">Ajans</th>
                <th className="pb-3 pr-4">E-posta</th>
                <th className="pb-3 pr-4">Referans</th>
                <th className="pb-3 pr-4">Komisyon %</th>
                <th className="pb-3 pr-4">Kazanç</th>
                <th className="pb-3 pr-4">Sipariş</th>
                <th className="pb-3 pr-4">Durum</th>
                <th className="pb-3">Kaydet</th>
              </tr>
            </thead>
            <tbody>
              {resellers.map((r) => (
                <ResellerAdminRow
                  key={r.id}
                  reseller={{
                    id: r.id,
                    agencyName: r.agencyName,
                    email: r.user.email,
                    referralCode: r.referralCode,
                    commissionRate: r.commissionRate,
                    totalEarnings: r.totalEarnings,
                    orderCount: r._count.orders,
                    isActive: r.isActive,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
