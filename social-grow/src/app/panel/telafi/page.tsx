import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PanelNav } from "@/components/panel-nav";
import { RefillAdminList } from "@/components/refill-admin-list";

export default async function RefillAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/panel");

  const requests = await prisma.refillRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-[#06060f]">
      <PanelNav session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Telafi Talepleri</h1>
        <p className="mb-6 text-sm text-zinc-500">Müşteri telafi başvurularını yönetin</p>
        <RefillAdminList
          requests={requests.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
