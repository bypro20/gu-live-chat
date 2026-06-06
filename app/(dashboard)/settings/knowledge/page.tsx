'use client'

import { useState, useEffect, use } from 'react'
import { useWebsite } from '@/lib/hooks/use-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  _count: { articles: number }
}

interface Article {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  viewCount: number
  helpful: number
  notHelpful: number
  isFeatured: boolean
  createdAt: string
  category: { id: string; name: string; slug: string } | null
  author: { id: string; name: string | null; image: string | null } | null
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  PUBLISHED: 'Yayında',
  ARCHIVED: 'Arşiv',
}

export default function KnowledgeBasePage() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('knowledgeBase')
  const { website } = useWebsite()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!website) return
    setLoading(true)
    Promise.all([
      fetch(`/api/knowledge/articles?websiteId=${website.id}&status=${statusFilter}&search=${search}${selectedCategory ? `&categoryId=${selectedCategory}` : ''}`).then(r => r.json()),
      fetch(`/api/knowledge/categories?websiteId=${website.id}`).then(r => r.json()),
    ]).then(([articlesData, categoriesData]) => {
      setArticles(articlesData.articles || [])
      setCategories(categoriesData || [])
    }).finally(() => setLoading(false))
  }, [website, selectedCategory, statusFilter, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Bu makaleyi silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/knowledge/articles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== id))
      }
    } catch {}
  }

  if (!website) return null
  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="knowledgeBase" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bilgi Bankası</h1>
          <p className="text-sm text-muted-foreground mt-1">Makale ve kategorileri yönetin</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/settings/knowledge/categories"
            className="flex-1 sm:flex-initial text-center px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl transition hover:bg-accent"
          >
            Kategoriler
          </Link>
          <Link
            href="/settings/knowledge/new"
            className="flex-1 sm:flex-initial text-center px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl transition hover:bg-primary-hover"
          >
            + Yeni Makale
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:content-start">
          <div className="surface p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Kategoriler</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!selectedCategory ? 'bg-primary-light text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
              >
                Tümü ({articles.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedCategory === cat.id ? 'bg-primary-light text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  {cat.icon && <span className="mr-2">{cat.icon}</span>}
                  {cat.name}
                  <span className="text-muted-foreground/60 ml-1">({cat._count.articles})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="surface p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Durum</h3>
            <div className="space-y-1">
              {[
                { value: 'all', label: 'Tümü' },
                { value: 'DRAFT', label: 'Taslak' },
                { value: 'PUBLISHED', label: 'Yayında' },
                { value: 'ARCHIVED', label: 'Arşiv' },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${statusFilter === s.value ? 'bg-primary-light text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Makale ara..."
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div className="surface">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : articles.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-medium text-foreground">Henüz makale yok</h3>
                <p className="text-sm text-muted-foreground mt-1">İlk bilgi bankası makalesini oluşturun</p>
                <Link href="/settings/knowledge/new" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary-hover transition">
                  Makale Oluştur
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {articles.map(article => (
                  <div key={article.id} className="p-4 surface-hover cursor-pointer" onClick={() => router.push(`/settings/knowledge/${article.id}`)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[article.status]}`}>
                            {statusLabels[article.status]}
                          </span>
                          {article.isFeatured && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-light text-primary">
                              Öne Çıkan
                            </span>
                          )}
                          {article.category && (
                            <span className="text-xs text-muted-foreground">{article.category.name}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground truncate">{article.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{article.viewCount} görüntülenme</span>
                          {article.helpful + article.notHelpful > 0 && (
                            <span>%{Math.round((article.helpful / (article.helpful + article.notHelpful)) * 100)} faydalı</span>
                          )}
                          <span>{new Date(article.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(article.id) }}
                        className="p-2 text-muted-foreground hover:text-destructive transition shrink-0"
                      >
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
      </div>
    </div>
  )
}
