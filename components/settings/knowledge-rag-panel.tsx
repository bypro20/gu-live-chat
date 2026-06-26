'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Trash2, Link2, FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

type RagSource = {
  id: string
  type: string
  name: string
  url: string | null
  status: string
  chunkCount: number
  errorMessage: string | null
  lastIndexedAt: string | null
}

export function KnowledgeRagPanel({ websitePublicId }: { websitePublicId: string }) {
  const [sources, setSources] = useState<RagSource[]>([])
  const [chunkCount, setChunkCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [urlName, setUrlName] = useState('')
  const [textName, setTextName] = useState('')
  const [textContent, setTextContent] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    if (!websitePublicId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/knowledge/rag?websiteId=${websitePublicId}`)
      const data = await res.json()
      if (res.ok) {
        setSources(data.sources || [])
        setChunkCount(data.chunkCount || 0)
      }
    } finally {
      setLoading(false)
    }
  }, [websitePublicId])

  useEffect(() => {
    void load()
  }, [load])

  const addSource = async (payload: Record<string, string>) => {
    setBusy('add')
    setError(null)
    try {
      const res = await fetch('/api/knowledge/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: websitePublicId, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Eklenemedi')
      setUrl('')
      setUrlName('')
      setTextName('')
      setTextContent('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setBusy(null)
    }
  }

  const reindexArticles = async () => {
    setBusy('reindex')
    setError(null)
    try {
      const res = await fetch('/api/knowledge/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: websitePublicId, action: 'reindex-articles' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'İndekslenemedi')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setBusy(null)
    }
  }

  const removeSource = async (sourceId: string) => {
    setBusy(sourceId)
    try {
      await fetch(`/api/knowledge/rag?sourceId=${sourceId}`, { method: 'DELETE' })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const uploadPdf = async () => {
    if (!pdfFile || !pdfName.trim()) return
    setBusy('pdf')
    setError(null)
    try {
      const form = new FormData()
      form.append('websiteId', websitePublicId)
      form.append('name', pdfName.trim())
      form.append('file', pdfFile)
      const res = await fetch('/api/knowledge/rag/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'PDF yüklenemedi')
      setPdfName('')
      setPdfFile(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">AI Bilgi Eğitimi (RAG)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            URL, PDF, metin veya yayınlanmış makalelerden semantik arama. Toplam {chunkCount} parça indeksli.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={busy === 'reindex'} onClick={() => void reindexArticles()}>
          {busy === 'reindex' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Makaleleri yeniden indeksle</span>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4" /> Web sitesi / URL
          </div>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Kaynak adı"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={!url.trim() || !urlName.trim() || busy === 'add'}
            onClick={() => void addSource({ type: 'URL', name: urlName.trim(), url: url.trim() })}
          >
            URL ekle
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" /> Metin / doküman
          </div>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Kaynak adı"
            value={textName}
            onChange={(e) => setTextName(e.target.value)}
          />
          <textarea
            className="w-full min-h-[88px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="SSS, politika metni, ürün açıklaması..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={!textName.trim() || !textContent.trim() || busy === 'add'}
            onClick={() =>
              void addSource({ type: 'TEXT', name: textName.trim(), textContent: textContent.trim() })
            }
          >
            Metin ekle
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4" /> PDF yükle
          </div>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Kaynak adı"
            value={pdfName}
            onChange={(e) => setPdfName(e.target.value)}
          />
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            size="sm"
            disabled={!pdfName.trim() || !pdfFile || busy === 'pdf'}
            onClick={() => void uploadPdf()}
          >
            {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF ekle'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
        </div>
      ) : sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz harici kaynak yok — URL veya metin ekleyin.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.type} · {s.status} · {s.chunkCount} parça
                  {s.errorMessage ? ` · ${s.errorMessage}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy === s.id}
                onClick={() => void removeSource(s.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
