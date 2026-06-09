"use client";

import { useState } from "react";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const ref = new URLSearchParams(window.location.search).get("ref") || "";
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        message: fd.get("message"),
        referralCode: ref,
      }),
    });
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="card text-center">
        <p className="text-xl font-bold text-green-400">Mesajınız alındı!</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <input name="name" required placeholder="Ad Soyad" className="input" />
      <input name="email" type="email" required placeholder="E-posta" className="input" />
      <input name="phone" placeholder="Telefon" className="input" />
      <textarea name="message" rows={4} placeholder="Mesajınız" className="input" />
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "..." : "Gönder"}
      </button>
    </form>
  );
}
