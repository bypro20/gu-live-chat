'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'
import { Button } from '@/components/ui/button'
import { MODEL_PRESETS, DEFAULT_MODEL } from '@/lib/ai/models'
import type { AiProvider } from '@/lib/ai/provider'

interface AiConfig {
  id: string | null
  isActive: boolean
  provider: AiProvider
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
  gemini: boolean
  groq: boolean
  openrouter: boolean
  ollama: boolean
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
  OPENAI: 'OpenAI (GPT)',
  ANTHROPIC: 'Anthropic (Claude)',
  GEMINI: 'Google Gemini',
  GROQ: 'Groq (Llama — açık kaynak)',
  OPENROUTER: 'OpenRouter (ücretsiz açık kaynak modeller)',
  OLLAMA: 'Ollama (kendi sunucunuz — tamamen açık kaynak)',
}

const DEFAULT_CONFIG: AiConfig = {
  id: null,
  isActive: false,
  provider: 'OPENAI',
  model: 'gpt-4o-mini',
  apiKey: '',
  temperature: 0.75,
  systemPrompt: '',
  autoSuggest: true,
  autoReply: false,
}

export default function AiBotSettings() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('aiAssistant')
  const { activeWebsite } = useActiveWebsite()
  const websiteId = activeWebsite?.websiteId

  const [config, setConfig] = useState<AiConfig>(DEFAULT_CONFIG)
  const [env, setEnv] = useState<EnvStatus>({ openai: false, anthropic: false, gemini: false, groq: false, openrouter: false, ollama: false })
  const [platformReady, setPlatformReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testMsg, setTestMsg] = useState('Merhaba, fiyatlarınız hakkında bilgi alabilir miyim?')
  const [testReply, setTestReply] = useState<string | null>(null)
  const [testMode, setTestMode] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

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
        if (data.platformReady) setPlatformReady(true)
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

  const handleProviderChange = (provider: AiProvider) => {
    setConfig((c) => ({
      ...c,
      provider,
      model: MODEL_PRESETS[provider][0]?.value ?? DEFAULT_MODEL[provider],
    }))
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

  const handleTest = async () => {
    if (!websiteId || !testMsg.trim()) return
    setTesting(true)
    setTestReply(null)
    setTestMode(null)
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, message: testMsg.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test başarısız')
      setTestReply(data.reply)
      setTestMode(data.mode === 'llm' ? 'Gerçek AI (LLM)' : 'Yedek mod (bilgi tabanı)')
    } catch (err) {
      setTestReply(err instanceof Error ? err.message : 'Test başarısız')
      setTestMode(null)
    } finally {
      setTesting(false)
    }
  }

  const envForProvider = (p: AiProvider) => {
    if (p === 'OPENAI') return env.openai
    if (p === 'ANTHROPIC') return env.anthropic
    if (p === 'GEMINI') return env.gemini
    if (p === 'OPENROUTER') return env.openrouter
    if (p === 'OLLAMA') return env.ollama
    return env.groq
  }

  const keyAvailable = envForProvider(config.provider) || config._hasApiKey || platformReady

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="aiAssistant" />
  }

  return (
    <div className="surface p-5 sm:p-6 mb-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Sohbet Asistanı
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            GPT, Gemini, Claude, Groq, OpenRouter (ücretsiz Llama/Gemma) veya Ollama ile doğal sohbet.
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
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">AI Sağlayıcıları</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${envForProvider(p) ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                  <span className="text-muted-foreground">{PROVIDER_LABELS[p]}:</span>
                  <span className={envForProvider(p) ? 'text-success font-medium' : 'text-muted-foreground'}>
                    {envForProvider(p) ? 'Hazır' : 'Anahtar yok'}
                  </span>
                </div>
              ))}
            </div>
            {keyAvailable ? (
              <p className="text-xs text-success mt-3">
                ✓ Gerçek yapay zeka modu aktif — ziyaretçilerle akıllı sohbet edebilirsiniz.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Ücretsiz açık kaynak için: <code className="px-1 py-0.5 rounded bg-card border text-[11px]">OPENROUTER_API_KEY</code> (openrouter.ai) veya{' '}
                <code className="px-1 py-0.5 rounded bg-card border text-[11px]">GEMINI_API_KEY</code>. Kendi sunucu:{' '}
                <code className="px-1 py-0.5 rounded bg-card border text-[11px]">OLLAMA_BASE_URL</code>.
                Anahtar olmadan sadece basit SSS yanıtları verilir.
              </p>
            )}
          </div>

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
                <span className="block text-xs text-muted-foreground">Widget, WhatsApp ve tüm kanallarda AI açılır.</span>
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
                <span className="block text-sm font-medium text-foreground">Otomatik sohbet yanıtı</span>
                <span className="block text-xs text-muted-foreground">
                  Ziyaretçi mesajına anında akıllı cevap. Temsilci atanınca durur.
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
                <span className="block text-xs text-muted-foreground">Gelen kutusunda AI ile yanıt taslağı.</span>
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Sağlayıcı</label>
              <select
                value={config.provider}
                onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Model</label>
              <select
                value={config.model}
                onChange={(e) => update('model', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                {MODEL_PRESETS[config.provider].map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Yaratıcılık ({config.temperature.toFixed(1)})
            </label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.1}
              value={config.temperature}
              onChange={(e) => update('temperature', Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">API Anahtarı (opsiyonel)</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder={config._hasApiKey ? '•••••••• (kayıtlı)' : 'Siteye özel anahtar — boş bırakırsanız sunucu anahtarı kullanılır'}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Kişilik / Sistem Talimatı</label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              rows={4}
              placeholder="Örn: Sen X markasının satış danışmanısın. Samimi konuş, ürünleri öner, fiyat sorulunca paketleri anlat..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-y"
            />
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Canlı Test
            </h3>
            <textarea
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <Button type="button" variant="secondary" onClick={handleTest} disabled={testing} loading={testing}>
              {testing ? 'Yanıt alınıyor...' : 'AI\'ya sor'}
            </Button>
            {testReply && (
              <div className="rounded-lg bg-card border border-border p-3 text-sm">
                {testMode && <p className="text-xs text-muted-foreground mb-1">{testMode}</p>}
                <p className="text-foreground whitespace-pre-wrap">{testReply}</p>
              </div>
            )}
          </div>

          {message && (
            <div
              className={`text-sm rounded-lg px-4 py-2.5 ${
                message.type === 'success' ? 'bg-success-light text-success' : 'bg-destructive/10 text-destructive'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} loading={saving}>
              Kaydet
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
