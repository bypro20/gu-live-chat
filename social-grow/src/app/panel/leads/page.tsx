import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PanelNav } from "@/components/panel-nav";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/panel");

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { reseller: true },
  });

  return (
    <div className="min-h-screen bg-[#06060f]">
      <PanelNav session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-white">Leads / İletişim</h1>
        <div className="space-y-4">
          {leads.map((l) => (
            <div key={l.id} className="card">
              <div className="flex justify-between">
                <strong className="text-white">{l.name}</strong>
                <span className="text-xs text-zinc-500">{l.createdAt.toLocaleDateString("tr-TR")}</span>
              </div>
              <p className="text-sm text-zinc-400">{l.email} {l.phone && `• ${l.phone}`}</p>
              {l.message && <p className="mt-2 text-zinc-300">{l.message}</p>}
              {l.reseller && <p className="mt-1 text-xs text-violet-400">Bayi: {l.reseller.agencyName}</p>}
            </div>
          ))}
          {leads.length === 0 && <p className="text-zinc-500">Henüz lead yok</p>}
        </div>
      </main>
    </div>
  );
}
