'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

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
  content?: string
  excerpt: string | null
  status: string
  viewCount: number
  helpful: number
  notHelpful: number
  isFeatured: boolean
  publishedAt: string | null
  category: { id: string; name: string; slug: string } | null
  author: { id: string; name: string | null } | null
}

export default function PublicKnowledgePage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params)
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [websiteName, setWebsiteName] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/knowledge/articles?websiteId=${websiteId}&status=PUBLISHED&search=${search}${selectedCategory ? `&categoryId=${selectedCategory}` : ''}`)
      .then(r => r.json())
      .then(data => setArticles(data.articles || []))
      .catch(() => {})
    fetch(`/api/knowledge/categories?websiteId=${websiteId}`)
      .then(r => r.json())
      .then(data => setCategories(data || []))
      .catch(() => {})
    fetch(`/api/websites/${websiteId}`)
      .then(r => r.json())
      .then(data => setWebsiteName(data.name || 'Bilgi Bankası'))
      .catch(() => setWebsiteName('Bilgi Bankası'))
      .finally(() => setLoading(false))
  }, [websiteId, selectedCategory, search])

  useEffect(() => {
    if (selectedArticle && !selectedArticle.content) {
      fetch(`/api/knowledge/articles/${selectedArticle.id}?websiteId=${websiteId}`)
        .then(r => r.json())
        .then(data => { if (data.content) setSelectedArticle(prev => prev ? { ...prev, content: data.content } : prev) })
        .catch(() => {})
    }
  }, [selectedArticle?.id])

  const featured = articles.filter(a => a.isFeatured)
  const filtered = selectedArticle
    ? articles.filter(a => a.id === selectedArticle.id)
    : articles

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">{websiteName} - Bilgi Bankası</h1>
              <p className="text-sm text-muted-foreground mt-1">Sık sorulan sorular ve yardım dokümanları</p>
            </div>
            <Link href="/" className="shrink-0 text-sm text-muted-foreground hover:text-primary transition">
              Ana Sayfa
            </Link>
          </div>
          <div className="mt-6 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Makale ara..."
              className="w-full pl-12 pr-4 py-3 sm:py-3.5 border border-border rounded-2xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-base sm:text-lg"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <aside className="w-full lg:w-56 lg:shrink-0">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:sticky lg:top-8 -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:pb-0">
                <button
                  onClick={() => { setSelectedCategory(null); setSelectedArticle(null) }}
                  className={`shrink-0 lg:shrink lg:w-full whitespace-nowrap text-left px-3 py-2 rounded-lg text-sm transition ${!selectedCategory && !selectedArticle ? 'bg-primary-light text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  Tüm Makaleler
                </button>
                {categories.filter(c => c._count.articles > 0).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setSelectedArticle(null) }}
                    className={`shrink-0 lg:shrink lg:w-full whitespace-nowrap text-left px-3 py-2 rounded-lg text-sm transition ${selectedCategory === cat.id ? 'bg-primary-light text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
                  >
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0">
              {selectedArticle ? (
                <article className="animate-in">
                  <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition mb-6">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Geri
                  </button>
                  <div className="surface p-5 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                      {selectedArticle.category && (
                        <span className="px-2 py-0.5 bg-primary-light text-primary rounded-full">{selectedArticle.category.name}</span>
                      )}
                      {selectedArticle.viewCount > 0 && <span>{selectedArticle.viewCount} görüntülenme</span>}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{selectedArticle.title}</h1>
                    {selectedArticle.excerpt && (
                      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{selectedArticle.excerpt}</p>
                    )}
                    <div className="prose prose-gray dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap break-words text-foreground">
                      {selectedArticle.content}
                    </div>
                  </div>
                </article>
              ) : (
                <>
                  {featured.length > 0 && !search && !selectedCategory && (
                    <section className="mb-10">
                      <h2 className="text-lg font-semibold text-foreground mb-4">Öne Çıkan Makaleler</h2>
                      <div className="grid gap-4">
                        {featured.map(article => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article)}
                            className="surface p-5 surface-hover text-left"
                          >
                            <h3 className="font-semibold text-foreground">{article.title}</h3>
                            {article.excerpt && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{article.excerpt}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    {!search && !selectedCategory && <h2 className="text-lg font-semibold text-foreground mb-4">Tüm Makaleler</h2>}
                    {filtered.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="font-medium text-foreground">Makale bulunamadı</h3>
                        <p className="text-sm text-muted-foreground mt-1">Aramanızla eşleşen makale yok</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filtered.map(article => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article)}
                            className="surface p-5 surface-hover text-left"
                          >
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              {article.category && (
                                <span className="px-2 py-0.5 bg-primary-light text-primary rounded-full">{article.category.name}</span>
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground">{article.title}</h3>
                            {article.excerpt && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{article.excerpt}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>{article.viewCount} görüntülenme</span>
                              {article.helpful + article.notHelpful > 0 && (
                                <span>%{Math.round((article.helpful / (article.helpful + article.notHelpful)) * 100)} faydalı</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          {websiteName} &copy; {new Date().getFullYear()} - Gu Live Chat ile desteklenmektedir
        </div>
      </footer>
    </div>
  )
}
