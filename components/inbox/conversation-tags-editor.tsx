'use client'

import { useCallback, useEffect, useState } from 'react'
import { Tag, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

type ConversationTag = {
  id: string
  name: string
  color: string
}

type ConversationTagsEditorProps = {
  conversationId: string
  websiteId: string
  initialTags: ConversationTag[]
  onChange?: (tags: ConversationTag[]) => void
}

export function ConversationTagsEditor({
  conversationId,
  websiteId,
  initialTags,
  onChange,
}: ConversationTagsEditorProps) {
  const { inbox: i } = useDashboardI18n()
  const [tags, setTags] = useState<ConversationTag[]>(initialTags)
  const [available, setAvailable] = useState<ConversationTag[]>([])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTags(initialTags)
  }, [initialTags, conversationId])

  const loadAvailable = useCallback(async () => {
    try {
      const res = await fetch(`/api/tags?websiteId=${encodeURIComponent(websiteId)}`)
      if (!res.ok) return
      const data = await res.json()
      setAvailable(Array.isArray(data.tags) ? data.tags : [])
    } catch {
      /* ignore */
    }
  }, [websiteId])

  useEffect(() => {
    void loadAvailable()
  }, [loadAvailable])

  const applyTags = (next: ConversationTag[]) => {
    setTags(next)
    onChange?.(next)
  }

  const addTag = async (name: string, tagId?: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagId ? { tagId } : { name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i.tagAddFailed)
      applyTags(data.tags || [])
      setInput('')
      void loadAvailable()
    } catch (err) {
      setError(err instanceof Error ? err.message : i.tagAddFailed)
    } finally {
      setSaving(false)
    }
  }

  const removeTag = async (tagId: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/tags?tagId=${encodeURIComponent(tagId)}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i.tagRemoveFailed)
      applyTags(data.tags || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : i.tagRemoveFailed)
    } finally {
      setSaving(false)
    }
  }

  const suggestions = available.filter(
    (tag) => !tags.some((t) => t.id === tag.id) && tag.name.toLowerCase().includes(input.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground">{i.noTagsYet}</span>
        ) : (
          tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="gap-1 pr-1 text-[11px]"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => void removeTag(tag.id)}
                disabled={saving}
                className="rounded p-0.5 hover:bg-muted disabled:opacity-50"
                aria-label={i.removeTag}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void addTag(input)
              }
            }}
            placeholder={i.tagPlaceholder}
            disabled={saving}
            className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-xs"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving || !input.trim()}
          onClick={() => void addTag(input)}
        >
          {i.addTag}
        </Button>
      </div>

      {suggestions.length > 0 && input.trim() && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 6).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => void addTag(tag.name, tag.id)}
              disabled={saving}
              className="text-[11px] px-2 py-1 rounded-md border border-border hover:border-primary/40 hover:text-primary transition disabled:opacity-50"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
