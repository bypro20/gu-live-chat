import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-8 text-center text-3xl font-bold text-white">Giriş</h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-zinc-500">
          Bayi değil misin? <a href="/bayilik" className="text-violet-400">Başvuru yap</a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
