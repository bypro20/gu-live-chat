import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PanelNav } from "@/components/panel-nav";
import { OrderStatusSelect } from "@/components/order-status-select";
import { SmmSendForm } from "@/components/smm-send-form";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/panel");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { package: true, reseller: true },
  });

  return (
    <div className="min-h-screen bg-[#06060f]">
      <PanelNav session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-white">Siparişler</h1>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="pb-3 pr-4">Müşteri</th>
                <th className="pb-3 pr-4">Hedef</th>
                <th className="pb-3 pr-4">Paket</th>
                <th className="pb-3 pr-4">Sipariş No</th>
                <th className="pb-3 pr-4">Bayi</th>
                <th className="pb-3 pr-4">Tutar</th>
                <th className="pb-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-white/10 text-zinc-300">
                  <td className="py-3 pr-4">
                    <div>{o.customerName}</div>
                    <div className="text-xs text-zinc-500">{o.customerEmail}</div>
                  </td>
                  <td className="py-3 pr-4">{o.targetLink || "—"}</td>
                  <td className="py-3 pr-4">{o.package.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{o.orderCode}</td>
                  <td className="py-3 pr-4">{o.reseller?.agencyName || "Direkt"}</td>
                  <td className="py-3 pr-4">₺{o.amount.toLocaleString("tr-TR")}</td>
                  <td className="py-3 align-top">
                    <OrderStatusSelect orderId={o.id} status={o.status} />
                    {o.smmOrderId && (
                      <p className="mt-1 text-xs text-violet-400">
                        {o.smmProvider || "smm"} #{o.smmOrderId}
                      </p>
                    )}
                    {!o.smmOrderId && o.paymentStatus === "PAID" && (
                      <SmmSendForm
                        orderId={o.id}
                        targetLink={o.targetLink}
                        platform={o.package.platform}
                        defaultProvider={o.package.smmProvider}
                        defaultServiceId={o.package.smmServiceId}
                        defaultQuantity={o.package.smmQuantity}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
