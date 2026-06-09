import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-8 text-3xl font-bold text-white">{title}</h1>
        <article className="card prose-legal space-y-4 text-sm leading-relaxed text-zinc-300">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}
