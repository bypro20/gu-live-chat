'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import Link from 'next/link'
import { Logo } from '@/components/marketing/logo'
import { Shield } from 'lucide-react'

const ADMIN_EMAIL = 'admin@guchat.org'

/** signIn(redirect:false) sets the cookie asynchronously — poll until the session is readable. */
async function waitForAdminSession(maxAttempts = 10, delayMs = 200): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const meRes = await fetch('/api/admin/me', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (meRes.ok) return true
    // 403 = logged in but not ADMIN; don't retry
    if (meRes.status === 403) return false
    await new Promise((r) => setTimeout(r, delayMs))
  }
  const session = await getSession()
  return session?.user?.role === 'ADMIN'
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const normalizedEmail = email.trim().toLowerCase()
    if (normalizedEmail !== ADMIN_EMAIL) {
      setError('Bu panel sadece yöneticiler içindir.')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      })

      if (result?.ok) {
        const isAdmin = await waitForAdminSession()
        if (isAdmin) {
          // Full navigation so the new session cookie is always sent to /admin
          window.location.href = '/admin'
          return
        }
        setError('Bu panel sadece yöneticiler içindir.')
      } else {
        setError('E-posta veya şifre hatalı')
      }
    } catch {
      setError('Giriş sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="surface p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo boyut="default" animasyonlu={false} />
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-light rounded-xl mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Guchat Yönetim Paneli</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              guchat.org · Sadece platform yöneticileri
            </p>
          </div>

          {error && (
            <div className="bg-destructive-light text-destructive rounded-lg p-3 mb-6 text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Yönetici E-posta
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted/40 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="admin@guchat.org"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted/40 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-brand"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Yönetici Girişi'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Yönetici hesabınızla giriş yapın.
          </p>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition">
              ← Müşteri girişi
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
