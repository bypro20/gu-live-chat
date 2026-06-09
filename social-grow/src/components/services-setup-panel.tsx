"use client";

import type { ServiceDefinition } from "@/lib/services-registry";

const categoryLabels: Record<string, string> = {
  odeme: "Ödeme",
  teslimat: "Teslimat",
  bildirim: "Bildirim",
  guvenlik: "Güvenlik",
  veritabani: "Veritabanı",
};

export function ServicesSetupPanel({
  ready,
  services,
}: {
  ready: boolean;
  services: ServiceDefinition[];
}) {
  return (
    <div className="space-y-6">
      <div
        className={`card border ${
          ready ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
        }`}
      >
        <p className="text-lg font-semibold text-white">
          {ready ? "Zorunlu servisler hazır" : "Zorunlu servisler eksik"}
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          {services.filter((s) => s.configured).length}/{services.length} servis yapılandırıldı
        </p>
      </div>

      {services.map((service) => (
        <article key={service.id} className="card">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {categoryLabels[service.category]}
                {service.required && " · Zorunlu"}
              </p>
              <h2 className="text-lg font-semibold text-white">{service.name}</h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                service.configured
                  ? "bg-green-500/20 text-green-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {service.configured ? "Aktif" : "Kapalı"}
            </span>
          </div>

          <p className="mb-4 text-sm text-zinc-400">{service.principle}</p>

          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-zinc-500">Ortam değişkenleri</p>
            <div className="flex flex-wrap gap-2">
              {service.envVars.map((v) => (
                <code
                  key={v}
                  className="rounded bg-black/40 px-2 py-1 text-xs text-violet-300"
                >
                  {v}
                </code>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-zinc-500">Nasıl alınır?</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-400">
              {service.howToGet.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap gap-3">
            {service.setupUrl.startsWith("http") && (
              <a
                href={service.setupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm"
              >
                Kayıt / Panel →
              </a>
            )}
            {service.docsUrl && (
              <a
                href={service.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
              >
                API Dokümantasyonu
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
