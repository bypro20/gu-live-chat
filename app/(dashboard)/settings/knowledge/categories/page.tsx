'use client'

import { useState, useEffect } from 'react'
import { useWebsite } from '@/lib/hooks/use-website'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  order: number
  _count: { articles: number }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9a-zçğıöşü\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function CategoriesPage() {
  const { website } = useWebsite()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadCategories = () => {
    if (!website) return
    setLoading(true)
    fetch(`/api/knowledge/categories?websiteId=${website.id}`)
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCategories()
  }, [website])

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setIcon('')
    setEditingId(null)
    setShowForm(false)
    setAutoSlug(true)
  }

  const handleEdit = (cat: Category) => {
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || '')
    setIcon(cat.icon || '')
    setEditingId(cat.id)
    setShowForm(true)
    setAutoSlug(false)
  }

  const handleSave = async () => {
    if (!website || !name.trim() || !slug.trim()) {
      setMessage({ type: 'error', text: 'Ad ve slug zorunludur' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        websiteId: website.id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
      }

      let res
      if (editingId) {
        res = await fetch('/api/knowledge/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
      } else {
        res = await fetch('/api/knowledge/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kaydetme başarısız')
      }

      setMessage({ type: 'success', text: editingId ? 'Kategori güncellendi' : 'Kategori oluşturuldu' })
      resetForm()
      loadCategories()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kaydetme başarısız' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz? Kategoriye bağlı makaleler kategorisiz kalacaktır.')) return
    try {
      const res = await fetch(`/api/knowledge/categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadCategories()
      }
    } catch {}
  }

  if (!website) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/settings/knowledge" className="hover:text-primary">Bilgi Bankası</Link>
            <span>/</span>
            <span className="text-foreground">Kategoriler</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Kategoriler</h1>
          <p className="text-sm text-muted-foreground mt-1">Makale kategorilerini yönetin</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="w-full sm:w-auto px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl transition hover:bg-primary-hover"
        >
          + Yeni Kategori
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-success-light text-success'
            : 'bg-destructive-light text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="surface p-5 sm:p-6 mb-6 animate-in">
          <h3 className="text-lg font-semibold text-foreground mb-4">{editingId ? 'Kategori Düzenle' : 'Yeni Kategori'}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ad</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (autoSlug) setSlug(slugify(e.target.value)) }}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Kategori adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Slug
                  <button onClick={() => setAutoSlug(!autoSlug)} className="ml-2 text-xs text-muted-foreground hover:text-primary">
                    {autoSlug ? 'Otomatik' : 'Manuel'}
                  </button>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setAutoSlug(false) }}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="kategori-slugu"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Açıklama</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Kısa açıklama (opsiyonel)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Emoji / İkon</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="📁 (opsiyonel)"
                maxLength={2}
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
            <button onClick={resetForm} className="px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-accent transition">
              İptal
            </button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary-hover transition disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </div>
      )}

      <div className="surface">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Henüz kategori yok</h3>
            <p className="text-sm text-muted-foreground mt-1">Makaleleri kategorilere ayırmak için bir kategori oluşturun</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 flex items-center justify-between gap-3 surface-hover">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {cat.icon && <span className="text-2xl shrink-0">{cat.icon}</span>}
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      /{cat.slug} • {cat._count.articles} makale{cat.description ? ` • ${cat.description}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleEdit(cat)} className="p-2 text-muted-foreground hover:text-primary transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-muted-foreground hover:text-destructive transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
