"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Giriş başarısız");
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <input name="email" type="email" required placeholder="E-posta" className="input" />
      <input name="password" type="password" required placeholder="Şifre" className="input" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "..." : "Giriş Yap"}
      </button>
    </form>
  );
}
