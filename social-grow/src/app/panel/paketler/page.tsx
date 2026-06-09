import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PanelNav } from "@/components/panel-nav";
import { PackageSmmEditor } from "@/components/package-smm-editor";

export default async function PackagesAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/panel");

  const packages = await prisma.package.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#06060f]">
      <PanelNav session={session} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Paket → SMM Eşleme</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Her paket için SMM panel servis ID tanımlayın.{" "}
          <code className="text-violet-300">AUTO_SMM_FULFILL=true</code> ile ödeme sonrası otomatik
          gönderilir.
        </p>
        <PackageSmmEditor packages={packages} />
      </main>
    </div>
  );
}
