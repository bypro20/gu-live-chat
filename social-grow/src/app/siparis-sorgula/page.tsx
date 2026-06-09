"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

interface OrderResult {
  orderCode: string;
  packageName: string;
  amount: number;
  statusLabel: string;
  paymentStatus: string;
  smmStatus?: string | null;
  createdAt: string;
  paidAt: string | null;
}

export default function OrderQueryPage() {
  const [orderCode, setOrderCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!orderCode.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);

    const params = new URLSearchParams({ code: orderCode.trim() });
    if (email.trim()) params.set("email", email.trim());

    const res = await fetch(`/api/orders/lookup?${params}`);
    const data = await res.json();
    setLoading(false);

    if (data.found) {
      setResult(data.order);
    } else {
      setNotFound(true);
    }
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-4 text-center text-3xl font-bold text-white">Sipariş Sorgula</h1>
        <p className="mb-8 text-center text-sm text-zinc-400">
          Sipariş numaranızı girin. Ek güvenlik için e-posta adresinizi de ekleyebilirsiniz.
        </p>
        <form onSubmit={search} className="card space-y-4">
          <input
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            placeholder="PM-20260609-ABC123"
            className="input"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta (isteğe bağlı, ek doğrulama)"
            className="input"
            type="email"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sorgulanıyor..." : "Sorgula"}
          </button>
        </form>

        {notFound && (
          <p className="mt-4 text-center text-sm text-amber-400">
            Sipariş bulunamadı. Bilgilerinizi kontrol edin veya destek ile iletişime geçin.
          </p>
        )}

        {result && (
          <div className="card mt-6 space-y-3 text-sm">
            <p>
              <span className="text-zinc-500">Sipariş No:</span>{" "}
              <span className="font-mono text-violet-300">{result.orderCode}</span>
            </p>
            <p>
              <span className="text-zinc-500">Paket:</span> {result.packageName}
            </p>
            <p>
              <span className="text-zinc-500">Tutar:</span> ₺
              {result.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
            <p>
              <span className="text-zinc-500">Durum:</span> {result.statusLabel}
            </p>
            {result.smmStatus && (
              <p>
                <span className="text-zinc-500">Teslimat:</span> {result.smmStatus}
              </p>
            )}
            <p>
              <span className="text-zinc-500">Ödeme:</span>{" "}
              {result.paymentStatus === "PAID" ? "Ödendi" : "Bekliyor / Başarısız"}
            </p>
            {result.paidAt && (
              <p>
                <span className="text-zinc-500">Ödeme Tarihi:</span>{" "}
                {new Date(result.paidAt).toLocaleString("tr-TR")}
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
