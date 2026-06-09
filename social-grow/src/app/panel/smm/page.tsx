import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PanelNav } from "@/components/panel-nav";
import { SmmPanel } from "@/components/smm-panel";

export default async function SmmPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/panel");

  return (
    <div className="min-h-screen bg-[#06060f]">
      <PanelNav session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white">SMM API Panelleri</h1>
        <p className="mb-6 text-sm text-zinc-500">
          MoreSMM + JustAnotherPanel — API key .env dosyasından
        </p>
        <SmmPanel />
      </main>
    </div>
  );
}
