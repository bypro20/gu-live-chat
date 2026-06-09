import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ContactForm } from "@/components/contact-form";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-center text-4xl font-bold text-white">İletişim</h1>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="card space-y-3 text-sm text-zinc-300">
            <h2 className="text-lg font-semibold text-white">İletişim Bilgileri</h2>
            <p><strong className="text-white">Şirket:</strong> {SITE.legalName}</p>
            <p><strong className="text-white">Adres:</strong> {SITE.address}</p>
            <p><strong className="text-white">E-posta:</strong> {SITE.email}</p>
            <p><strong className="text-white">Telefon:</strong> {SITE.phone}</p>
            <p><strong className="text-white">WhatsApp:</strong> {SITE.whatsapp}</p>
            <p><strong className="text-white">Destek:</strong> {SITE.workingHours}</p>
            <p><strong className="text-white">MERSİS:</strong> {SITE.mersis}</p>
            <p><strong className="text-white">Vergi Dairesi:</strong> {SITE.taxOffice}</p>
            <p><strong className="text-white">Vergi No:</strong> {SITE.taxNo}</p>
          </div>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
