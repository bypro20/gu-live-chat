"use client";

import { useEffect, useState } from "react";
import type { Package } from "@/generated/prisma/client";
import { IyzicoCheckout } from "@/components/iyzico-checkout";
import { PaymentLogos } from "@/components/payment-logos";

interface CheckoutState {
  checkoutFormContent: string;
  amount: number;
  packageName: string;
  orderCode: string;
}

export function OrderForm({
  packages,
  preselectedSlug,
}: {
  packages: Package[];
  preselectedSlug?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [iyzicoEnabled, setIyzicoEnabled] = useState(true);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);

  const defaultPkg = preselectedSlug
    ? packages.find((p) => p.slug === preselectedSlug)
    : packages[0];

  useEffect(() => {
    fetch("/api/iyzico/status")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setIyzicoEnabled(Boolean(d.enabled)))
      .catch(() => setIyzicoEnabled(false));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepted) {
      setError("Devam etmek için sözleşmeleri kabul etmelisiniz.");
      return;
    }

    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const ref = new URLSearchParams(window.location.search).get("ref") || "";

    const res = await fetch("/api/iyzico/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: fd.get("name"),
        customerEmail: fd.get("email"),
        customerPhone: fd.get("phone"),
        targetLink: fd.get("targetLink"),
        packageId: fd.get("packageId"),
        referralCode: ref,
      }),
    });

    setLoading(false);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Ödeme başlatılamadı. Tekrar deneyin.");
      return;
    }

    if (data.checkoutFormContent) {
      setCheckout({
        checkoutFormContent: data.checkoutFormContent,
        amount: data.amount,
        packageName: data.packageName,
        orderCode: data.orderCode,
      });
    } else if (data.paymentPageUrl) {
      window.location.href = data.paymentPageUrl;
    }
  }

  const selectedPkg = defaultPkg || packages[0];

  return (
    <>
      <form id="siparis" onSubmit={submit} className="card mx-auto max-w-lg space-y-4">
        <h2 className="text-xl font-bold text-white">Sipariş ve Ödeme</h2>
        <p className="text-sm text-zinc-400">
          Paketinizi seçin, bilgilerinizi girin ve iyzico güvenli ödeme ile satın alın.
        </p>

        <input name="name" required placeholder="Ad Soyad *" className="input" />
        <input
          name="email"
          type="email"
          required
          placeholder="E-posta *"
          className="input"
        />
        <input name="phone" placeholder="Telefon (5xx xxx xx xx)" className="input" />
        <input
          name="targetLink"
          required
          placeholder="Hesap linki veya kullanıcı adı (@kullanici) *"
          className="input"
        />

        <select
          name="packageId"
          required
          defaultValue={selectedPkg?.id}
          className="input"
        >
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ₺{p.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </option>
          ))}
        </select>

        <label className="flex items-start gap-3 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <a href="/mesafeli-satis" className="text-violet-400 hover:underline">
              Mesafeli Satış Sözleşmesi
            </a>
            ,{" "}
            <a href="/teslimat-iade" className="text-violet-400 hover:underline">
              Teslimat ve İade Şartları
            </a>{" "}
            ve{" "}
            <a href="/gizlilik" className="text-violet-400 hover:underline">
              Gizlilik Sözleşmesi
            </a>
            &apos;ni okudum ve kabul ediyorum.
          </span>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!iyzicoEnabled && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Ödeme altyapısı yapılandırılıyor. Lütfen kısa süre sonra tekrar deneyin.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !iyzicoEnabled}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Ödeme hazırlanıyor..."
            : `Güvenli Ödeme ile Satın Al${
                selectedPkg
                  ? ` — ₺${selectedPkg.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                  : ""
              }`}
        </button>

        <PaymentLogos variant="checkout" />
        <p className="text-center text-[10px] text-zinc-500">
          256-bit SSL · 3D Secure · Kart bilgileriniz saklanmaz
        </p>
      </form>

      {checkout && (
        <IyzicoCheckout
          checkoutFormContent={checkout.checkoutFormContent}
          amount={checkout.amount}
          packageName={checkout.packageName}
          onClose={() => setCheckout(null)}
        />
      )}
    </>
  );
}
