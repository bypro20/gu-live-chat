'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

type VisitorContactEditorProps = {
  visitorId: string
  initialName?: string | null
  initialEmail?: string | null
  variant?: 'panel' | 'compact'
  onSaved?: (data: { name: string | null; email: string | null }) => void
}

export function VisitorContactEditor({
  visitorId,
  initialName,
  initialEmail,
  variant = 'panel',
  onSaved,
}: VisitorContactEditorProps) {
  const d = useDashboardI18n()
  const i = d.inbox
  const c = d.common
  const [name, setName] = useState(initialName ?? '')
  const [email, setEmail] = useState(initialEmail ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(initialName ?? '')
    setEmail(initialEmail ?? '')
  }, [visitorId, initialName, initialEmail])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/contacts/${visitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || i.updateFailed)
      onSaved?.({
        name: data.name ?? (name.trim() || null),
        email: data.email ?? (email.trim() || null),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : i.updateFailed)
    } finally {
      setSaving(false)
    }
  }

  const isCompact = variant === 'compact'

  return (
    <div className={isCompact ? 'px-3 py-2.5 border-b border-border bg-muted/30' : ''}>
      {!isCompact && (
        <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
          {i.editContactHint}
        </p>
      )}
      <div className={`flex ${isCompact ? 'flex-col sm:flex-row' : 'flex-col'} gap-2`}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={i.nameLabel}
          className={`h-9 text-sm bg-background ${isCompact ? 'flex-1' : ''}`}
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={i.email}
          className={`h-9 text-sm bg-background ${isCompact ? 'flex-1' : ''}`}
        />
        <Button
          type="button"
          size="sm"
          variant={isCompact ? 'secondary' : 'default'}
          className={isCompact ? 'shrink-0 h-9' : 'w-full h-9'}
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? i.contactSaved : c.save}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  )
}
