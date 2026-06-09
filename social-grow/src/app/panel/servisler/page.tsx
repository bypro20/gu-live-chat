import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServiceSummary } from "@/lib/services-registry";
import { PanelNav } from "@/components/panel-nav";
import { ServicesSetupPanel } from "@/components/services-setup-panel";

export default async function ServicesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/panel");

  const summary = getServiceSummary();

  return (
    <div className="min-h-screen bg-[#06060f]">
      <PanelNav session={session} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Servis & API Kurulumu</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Eksik API anahtarlarını buradan takip edin. Detaylı rehber:{" "}
          <code className="text-violet-300">docs/SERVISLER.md</code>
        </p>
        <ServicesSetupPanel ready={summary.ready} services={summary.services} />
      </main>
    </div>
  );
}
