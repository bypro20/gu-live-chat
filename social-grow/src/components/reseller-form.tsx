"use client";

import { useState } from "react";

export function ResellerForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/resellers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        agencyName: fd.get("agencyName"),
        phone: fd.get("phone"),
        whatsapp: fd.get("whatsapp"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Başvuru başarısız");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <p className="text-2xl font-bold text-green-400">✓ Başvuru alındı!</p>
        <p className="mt-2 text-zinc-400">
          Onay sonrası e-posta ile bilgilendirileceksin. Giriş yapıp paneli kullanabilirsin.
        </p>
        <a href="/giris" className="btn-primary mt-4 inline-block">Giriş Yap</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-white">Bayi Başvuru Formu</h2>
      <input name="name" required placeholder="Ad Soyad" className="input" />
      <input name="email" type="email" required placeholder="E-posta" className="input" />
      <input name="password" type="password" required minLength={8} placeholder="Şifre (min 8 karakter)" className="input" />
      <input name="agencyName" required placeholder="Ajans / Marka adı" className="input" />
      <input name="phone" placeholder="Telefon" className="input" />
      <input name="whatsapp" placeholder="WhatsApp" className="input" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Gönderiliyor..." : "Bayi Başvurusu Gönder"}
      </button>
    </form>
  );
}
