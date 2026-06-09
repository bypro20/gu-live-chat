"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function RefillPage() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/refill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderCode: form.get("order"),
        username: form.get("user"),
        note: form.get("note"),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Talep gönderilemedi");
      return;
    }

    setMsg("Telafi talebiniz alındı. 24 saat içinde dönüş yapılacaktır.");
    e.currentTarget.reset();
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-4 text-center text-3xl font-bold text-white">Telafi Talebi</h1>
        <p className="mb-8 text-center text-sm text-zinc-400">
          Sipariş kodunuz (PM-...) ve kullanıcı adınız ile telafi talebi oluşturun
        </p>
        <form onSubmit={submit} className="card space-y-4">
          <input
            name="order"
            required
            placeholder="Sipariş numarası (PM-20260609-ABC123)"
            className="input"
          />
          <input name="user" required placeholder="Kullanıcı adı (@...)" className="input" />
          <textarea name="note" rows={3} placeholder="Açıklama" className="input" />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Gönderiliyor..." : "Talep Gönder"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {msg && <p className="text-sm text-green-400">{msg}</p>}
        </form>
      </main>
      <Footer />
    </div>
  );
}
