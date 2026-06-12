'use client'

import { useState, useEffect, use } from 'react'
import { useWebsite } from '@/lib/hooks/use-website'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  categoryId: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isFeatured: boolean
  tags: string | null
  order: number
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9a-zçğıöşü\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function ArticleEditorPage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = use(params)
  const i18n = useSettingsI18n()
  const { knowledge: k, common: c } = i18n
  const { website } = useWebsite()
  const router = useRouter()
  const isNew = articleId === 'new'

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT')
  const [isFeatured, setIsFeatured] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [autoSlug, setAutoSlug] = useState(true)

  useEffect(() => {
    if (!website) return
    fetch(`/api/knowledge/categories?websiteId=${website.id}`)
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [website])

  useEffect(() => {
    if (isNew || !website) return
    fetch(`/api/knowledge/articles/${articleId}`)
      .then(r => r.json())
      .then((data: Article) => {
        setTitle(data.title)
        setSlug(data.slug)
        setContent(data.content)
        setExcerpt(data.excerpt || '')
        setCategoryId(data.categoryId)
        setStatus(data.status)
        setIsFeatured(data.isFeatured)
      })
      .catch(() => router.push('/settings/knowledge'))
      .finally(() => setLoading(false))
  }, [articleId, website, isNew, router])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (autoSlug) setSlug(slugify(value))
  }

  const handleSave = async (newStatus?: 'DRAFT' | 'PUBLISHED') => {
    if (!website || !title.trim() || !slug.trim() || !content.trim()) {
      setMessage({ type: 'error', text: k.requiredFields })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        websiteId: website.id,
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        categoryId,
        status: newStatus || status,
        isFeatured,
      }

      let res
      if (isNew) {
        res = await fetch('/api/knowledge/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/knowledge/articles/${articleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || c.saveFailed)
      }

      const saved = await res.json()
      setMessage({ type: 'success', text: k.articleSaved })
      if (isNew) {
        router.push(`/settings/knowledge/${saved.id}`)
      }
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : c.saveFailed })
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>${title || k.previewTitle}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-white text-gray-900 p-8 max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold mb-4">${title}</h1>
        ${excerpt ? `<p class="text-gray-500 mb-6">${excerpt}</p>` : ''}
        <div class="prose max-w-none">${content.replace(/\n/g, '<br>')}</div>
      </body></html>
    `)
    w.document.close()
  }

  if (!website) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{isNew ? k.newArticleTitle : k.editArticleTitle}</h1>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
          <button onClick={handlePreview} className="px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-accent transition">
            {c.preview}
          </button>
          <button onClick={() => handleSave('DRAFT')} disabled={saving} className="px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-accent transition disabled:opacity-50">
            {saving ? c.saving : k.saveDraft}
          </button>
          <button onClick={() => handleSave('PUBLISHED')} disabled={saving} className="col-span-2 sm:col-span-1 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary-hover transition disabled:opacity-50 shadow-brand">
            {saving ? k.publishing : k.publish}
          </button>
        </div>
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

      <div className="space-y-6">
        <div className="surface p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{k.titleLabel}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder={k.titlePlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {k.slug}
                <button onClick={() => setAutoSlug(!autoSlug)} className="ml-2 text-xs text-muted-foreground hover:text-primary">
                  {autoSlug ? c.auto : c.manual}
                </button>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setAutoSlug(false) }}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder={k.slugArticlePlaceholder}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{k.excerptLabel}</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder={k.excerptPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{k.contentLabel}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-y font-mono text-sm"
              placeholder={k.contentPlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{k.categoryLabel}</label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="">{k.selectCategory}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{k.status}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="DRAFT">{k.statusDraft}</option>
                <option value="PUBLISHED">{k.statusPublished}</option>
                <option value="ARCHIVED">{k.statusArchived}</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-foreground">{k.featuredArticle}</span>
          </label>
        </div>
      </div>
    </div>
  )
}
