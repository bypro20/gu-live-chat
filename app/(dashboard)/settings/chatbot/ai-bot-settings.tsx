'use client'

import { useEffect, useState } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'

interface AiConfig {
  id: string | null
  isActive: boolean
  provider: 'OPENAI' | 'ANTHROPIC'
  model: string
  apiKey: string
  temperature: number
  systemPrompt: string
  autoSuggest: boolean
  autoReply: boolean
  _hasApiKey?: boolean
}

interface EnvStatus {
  openai: boolean
  anthropic: boolean
}

const DEFAULT_CONFIG: AiConfig = {
  id: null,
  isActive: false,
  provider: 'OPENAI',
  model: 'gpt-4o-mini',
  apiKey: '',
  temperature: 0.7,
  systemPrompt: '',
  autoSuggest: true,
  autoReply: false,
}

export default function AiBotSettings() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('aiAssistant')
  const { activeWebsite } = useActiveWebsite()
  const websiteId = activeWebsite?.websiteId

  const [config, setConfig] = useState<AiConfig>(DEFAULT_CONFIG)
  const [env, setEnv] = useState<EnvStatus>({ openai: false, anthropic: false })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!websiteId) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/ai/config?websiteId=${websiteId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.aiConfig) {
          setConfig({ ...DEFAULT_CONFIG, ...data.aiConfig, apiKey: '' })
        }
        if (data.env) setEnv(data.env)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [websiteId])

  const update = <K extends keyof AiConfig>(key: K, value: AiConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }))
  }

  const handleSave = async () => {
    if (!websiteId) return
    setSaving(true)
    setMessage(null)
    try {
      const payload: Record<string, unknown> = {
        websiteId,
        isActive: config.isActive,
        provider: config.provider,
        model: config.model,
        temperature: config.temperature,
        systemPrompt: config.systemPrompt,
        autoSuggest: config.autoSuggest,
        autoReply: config.autoReply,
      }
      // Only send apiKey when the admin typed a new value.
      if (config.apiKey.trim()) payload.apiKey = config.apiKey.trim()

      const res = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Ayarlar kaydedilemedi')
      if (data.aiConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...data.aiConfig, apiKey: '' })
      }
      setMessage({ type: 'success', text: 'AI asistan ayarları kaydedildi.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ayarlar kaydedilemedi',
      })
    } finally {
      setSaving(false)
    }
  }

  const envKeyDefined = config.provider === 'OPENAI' ? env.openai : env.anthropic
  const keyAvailable = envKeyDefined || config._hasApiKey

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="aiAssistant" />
  }

  return (
    <div className="surface p-5 sm:p-6 mb-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>✨</span> AI Asistan
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Yapay zekâ destekli otomatik yanıtlar ve temsilci önerileri
          </p>
        </div>
      </div>

      {!websiteId ? (
        <p className="text-sm text-muted-foreground">Önce bir site seçin.</p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Yükleniyor...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Provider key status */}
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Sağlayıcı Durumu</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${env.openai ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                <span className="text-muted-foreground">OpenAI anahtarı (sunucu):</span>
                <span className={env.openai ? 'text-success font-medium' : 'text-muted-foreground'}>
                  {env.openai ? 'Tanımlı' : 'Tanımsız'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${env.anthropic ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                <span className="text-muted-foreground">Anthropic anahtarı (sunucu):</span>
                <span className={env.anthropic ? 'text-success font-medium' : 'text-muted-foreground'}>
                  {env.anthropic ? 'Tanımlı' : 'Tanımsız'}
                </span>
              </div>
            </div>
            {!keyAvailable && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Hiçbir API anahtarı tanımlı değil. AI yine de çalışır; bilgi tabanı/SSS
                tabanlı akıllı yanıtlar verir. Tam LLM modu için sunucuya
                <code className="mx-1 px-1 py-0.5 rounded bg-card border border-border text-[11px]">OPENAI_API_KEY</code>
                veya
                <code className="mx-1 px-1 py-0.5 rounded bg-card border border-border text-[11px]">ANTHROPIC_API_KEY</code>
                ekleyin.
              </p>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary rounded border-border"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">AI asistanı etkinleştir</span>
                <span className="block text-xs text-muted-foreground">AI özelliklerini bu site için açar.</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoReply}
                onChange={(e) => update('autoReply', e.target.checked)}
                disabled={!config.isActive}
                className="mt-0.5 w-4 h-4 accent-primary rounded border-border disabled:opacity-50"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">Widget&apos;ta otomatik yanıt</span>
                <span className="block text-xs text-muted-foreground">
                  Ziyaretçi mesajlarına bot otomatik cevap verir. Bir temsilci sohbete atandığında devre dışı kalır.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSuggest}
                onChange={(e) => update('autoSuggest', e.target.checked)}
                disabled={!config.isActive}
                className="mt-0.5 w-4 h-4 accent-primary rounded border-border disabled:opacity-50"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">Temsilci için yanıt önerisi</span>
                <span className="block text-xs text-muted-foreground">
                  Gelen kutusunda &quot;✨ AI ile yanıtla&quot; butonuyla öneri alın.
                </span>
              </span>
            </label>
          </div>

          {/* Provider + model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Sağlayıcı</label>
              <select
                value={config.provider}
                onChange={(e) => update('provider', e.target.value as AiConfig['provider'])}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="OPENAI">OpenAI</option>
                <option value="ANTHROPIC">Anthropic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Model</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => update('model', e.target.value)}
                placeholder={config.provider === 'OPENAI' ? 'gpt-4o-mini' : 'claude-3-5-haiku-latest'}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Optional per-site API key */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              API Anahtarı (opsiyonel)
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder={config._hasApiKey ? '•••••••• (kayıtlı — değiştirmek için yeni anahtar girin)' : 'Sunucu anahtarı yoksa buraya girebilirsiniz'}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Sunucudaki ortam anahtarı her zaman önceliklidir. Anahtar güvenli saklanır, hiçbir zaman gösterilmez.
            </p>
          </div>

          {/* System prompt */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Sistem Talimatı (opsiyonel)
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              rows={3}
              placeholder="Örn: Sen markamızın kibar destek asistanısın. Kısa ve Türkçe yanıt ver..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-y"
            />
          </div>

          {message && (
            <div
              className={`text-sm rounded-lg px-4 py-2.5 ${
                message.type === 'success'
                  ? 'bg-success-light text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
