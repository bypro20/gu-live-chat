'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Palette, RotateCcw } from 'lucide-react'
import { useToast } from '@/lib/toast'
import {
  applyPlatformThemeToDocument,
  DEFAULT_PLATFORM_THEME,
  PLATFORM_THEME_PRESETS,
  PLATFORM_THEME_UPDATED_EVENT,
  type PlatformTheme,
} from '@/lib/platform-theme'

type ThemeField = {
  key: keyof PlatformTheme
  label: string
  hint: string
}

const FIELDS: ThemeField[] = [
  { key: 'background', label: 'Arka plan', hint: 'Sayfa ve panel zemini' },
  { key: 'foreground', label: 'Yazı rengi', hint: 'Başlık ve ana metin' },
  { key: 'card', label: 'Kart arka planı', hint: 'Kutular ve modaller' },
  { key: 'cardForeground', label: 'Kart yazısı', hint: 'Kart içi metin' },
  { key: 'muted', label: 'İkincil zemin', hint: 'Hover ve soluk alanlar' },
  { key: 'mutedForeground', label: 'İkincil yazı', hint: 'Açıklama ve etiketler' },
  { key: 'border', label: 'Kenarlık', hint: 'Çizgiler ve ayraçlar' },
  { key: 'accent', label: 'Vurgu / buton', hint: 'Ana butonlar ve linkler' },
  { key: 'accentForeground', label: 'Buton yazısı', hint: 'Vurgulu buton metni' },
]

function ColorRow({
  field,
  value,
  onChange,
}: {
  field: ThemeField
  value: string
  onChange: (key: keyof PlatformTheme, value: string) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_8rem_auto] gap-3 items-center py-3 border-b last:border-b-0" style={{ borderColor: 'var(--admin-border)' }}>
      <div className="min-w-0">
        <p className="text-sm font-medium admin-text">{field.label}</p>
        <p className="text-[11px] admin-text-muted">{field.hint}</p>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        className="admin-form-input h-10 font-mono text-xs uppercase"
        spellCheck={false}
      />
      <label className="relative w-11 h-11 rounded-xl border overflow-hidden cursor-pointer shrink-0" style={{ borderColor: 'var(--admin-border)' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
          aria-label={field.label}
        />
      </label>
    </div>
  )
}

function ThemePreview({ theme }: { theme: PlatformTheme }) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: theme.border, background: theme.background, color: theme.foreground }}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between gap-2" style={{ borderColor: theme.border, background: theme.card }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
            Platform Yönetimi
          </p>
          <p className="text-sm font-bold" style={{ color: theme.foreground }}>Önizleme</p>
        </div>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: theme.accent, color: theme.accentForeground }}
        >
          Buton
        </button>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs" style={{ color: theme.mutedForeground }}>İkincil metin örneği</p>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: theme.muted }}>
          <div className="h-full w-2/3 rounded-full" style={{ background: theme.accent }} />
        </div>
      </div>
    </div>
  )
}

export function PlatformThemeEditor() {
  const { toast } = useToast()
  const [theme, setTheme] = useState<PlatformTheme>(DEFAULT_PLATFORM_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const preview = useCallback((next: PlatformTheme) => {
    applyPlatformThemeToDocument(next)
  }, [])

  useEffect(() => {
    fetch('/api/admin/theme')
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Yüklenemedi')
        const loaded = d.theme as PlatformTheme
        setTheme(loaded)
        preview(loaded)
      })
      .catch((e) => {
        toast({ title: e instanceof Error ? e.message : 'Tema yüklenemedi', variant: 'error' })
      })
      .finally(() => setLoading(false))
  }, [preview, toast])

  const updateField = (key: keyof PlatformTheme, value: string) => {
    setTheme((prev) => {
      const next = { ...prev, [key]: value }
      preview(next)
      return next
    })
  }

  const applyPreset = (presetKey: string) => {
    const preset = PLATFORM_THEME_PRESETS[presetKey]
    if (!preset) return
    setTheme(preset.theme)
    preview(preset.theme)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Kaydedilemedi')
      const saved = d.theme as PlatformTheme
      setTheme(saved)
      applyPlatformThemeToDocument(saved)
      window.dispatchEvent(new CustomEvent(PLATFORM_THEME_UPDATED_EVENT, { detail: saved }))
      toast({ title: 'Renkler kaydedildi — tüm paneller güncellendi', variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Kayıt başarısız', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/admin/theme', { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Sıfırlanamadı')
      const reset = d.theme as PlatformTheme
      setTheme(reset)
      applyPlatformThemeToDocument(reset)
      window.dispatchEvent(new CustomEvent(PLATFORM_THEME_UPDATED_EVENT, { detail: reset }))
      toast({ title: 'Varsayılan renklere dönüldü', variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Sıfırlama başarısız', variant: 'error' })
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-form-section flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin admin-text-muted" />
      </div>
    )
  }

  return (
    <div className="admin-form-section space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold admin-text flex items-center gap-2">
            <Palette className="w-4 h-4 admin-text-accent" />
            Site & Panel Renkleri
          </h2>
          <p className="text-xs admin-text-muted mt-1 max-w-xl">
            Admin paneli, müşteri paneli ve tüm arayüzlerde kullanılan renkleri buradan ayarlayın.
            Değişiklikler kaydedildiğinde tüm siteye uygulanır.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PLATFORM_THEME_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="admin-filter-chip"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="rounded-xl border px-4" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-card)' }}>
          {FIELDS.map((field) => (
            <ColorRow
              key={field.key}
              field={field}
              value={theme[field.key]}
              onChange={updateField}
            />
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider admin-text-muted">Canlı önizleme</p>
          <ThemePreview theme={theme} />
          <p className="text-[11px] admin-text-faint">
            Arka plan ile yazı, buton ile zemin renkleri birbirinden farklı olmalı — okunabilirlik için kontrastı kontrol edin.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting || saving}
          className="admin-btn-ghost justify-center"
        >
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Varsayılana dön
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || resetting}
          className="admin-btn-primary justify-center"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Renkleri kaydet
        </button>
      </div>
    </div>
  )
}
