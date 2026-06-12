'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'
import { Button } from '@/components/ui/button'
import { DEFAULT_MODEL, MODEL_PRESETS, type ModelPreset } from '@/lib/ai/models'
import type { AiProvider } from '@/lib/ai/provider'
import type { PlanType } from '@/lib/constants'

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

interface PlanAiAccess {
  maxTier: string
  labelTr: string
  labelEn: string
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
  const { common, aiBot: ai, locale } = useSettingsI18n()
  const websiteId = activeWebsite?.websiteId

  const [config, setConfig] = useState<AiConfig>(DEFAULT_CONFIG)
  const [env, setEnv] = useState<EnvStatus>({ openai: false, anthropic: false, gemini: false, groq: false, openrouter: false, ollama: false })
  const [platformReady, setPlatformReady] = useState(false)
  const [platformFallback, setPlatformFallback] = useState(false)
  const [plan, setPlan] = useState<PlanType>('FREE')
  const [planAiAccess, setPlanAiAccess] = useState<PlanAiAccess | null>(null)
  const [allowedProviders, setAllowedProviders] = useState<AiProvider[]>([])
  const [allowedModelsByProvider, setAllowedModelsByProvider] = useState<Partial<Record<AiProvider, ModelPreset[]>>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testMsg, setTestMsg] = useState(ai.defaultTestMessage)
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
        if (data.platformFallback) setPlatformFallback(true)
        if (data.plan) setPlan(data.plan)
        if (data.planAiAccess) setPlanAiAccess(data.planAiAccess)
        if (data.allowedProviders) setAllowedProviders(data.allowedProviders)
        if (data.allowedModelsByProvider) setAllowedModelsByProvider(data.allowedModelsByProvider)
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

  const providerOptions = useMemo(() => {
    const keys = allowedProviders.length > 0 ? allowedProviders : (Object.keys(ai.providers) as AiProvider[])
    return keys
  }, [allowedProviders, ai.providers])

  const modelOptions = useMemo(() => {
    const allowed = allowedModelsByProvider[config.provider]
    if (allowed && allowed.length > 0) return allowed
    return MODEL_PRESETS[config.provider] ?? []
  }, [allowedModelsByProvider, config.provider])

  const planLabel = planAiAccess
    ? locale === 'en'
      ? planAiAccess.labelEn
      : planAiAccess.labelTr
    : ''

  const handleProviderChange = (provider: AiProvider) => {
    const models = allowedModelsByProvider[provider] ?? MODEL_PRESETS[provider]
    const firstAllowed = models[0]?.value ?? DEFAULT_MODEL[provider]
    setConfig((c) => ({
      ...c,
      provider,
      model: firstAllowed,
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
      if (!res.ok) throw new Error(data.error || ai.saveFailed)
      if (data.aiConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...data.aiConfig, apiKey: '' })
      }
      setMessage({ type: 'success', text: ai.saveSuccess })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : ai.saveFailed,
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
      if (!res.ok) throw new Error(data.error || ai.testFailed)
      setTestReply(data.reply)
      setTestMode(data.mode === 'llm' ? ai.testModeLlm : ai.testModeFallback)
    } catch (err) {
      setTestReply(err instanceof Error ? err.message : ai.testFailed)
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
            {ai.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {ai.subtitle}
          </p>
        </div>
      </div>

      {!websiteId ? (
        <p className="text-sm text-muted-foreground">{ai.selectSiteFirst}</p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {common.loading}
        </div>
      ) : (
        <div className="space-y-5">
          {planLabel && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">{ai.planModelsTitle}</h3>
              <p className="text-sm text-foreground">{planLabel}</p>
              <p className="text-xs text-muted-foreground mt-2">{ai.planModelsHint(planLabel)}</p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">{ai.providersTitle}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {(Object.keys(ai.providers) as AiProvider[]).map((p) => {
                const allowed = providerOptions.includes(p)
                return (
                  <div key={p} className={`flex items-center gap-2 ${!allowed ? 'opacity-50' : ''}`}>
                    <span className={`w-2 h-2 rounded-full ${envForProvider(p) && allowed ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                    <span className="text-muted-foreground">{ai.providers[p]}:</span>
                    <span className={envForProvider(p) && allowed ? 'text-success font-medium' : 'text-muted-foreground'}>
                      {!allowed ? ai.modelLocked.replace(' — ', '') : envForProvider(p) ? ai.ready : ai.noKey}
                    </span>
                  </div>
                )
              })}
            </div>
            {keyAvailable ? (
              <p className="text-xs text-success mt-3">
                {ai.aiModeActive}
                {platformFallback && (
                  <span className="block text-muted-foreground mt-1">{ai.platformFallbackHint}</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {ai.freeTierHint}
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
                <span className="block text-sm font-medium text-foreground">{ai.enableAssistant}</span>
                <span className="block text-xs text-muted-foreground">{ai.enableAssistantHint}</span>
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
                <span className="block text-sm font-medium text-foreground">{ai.autoReply}</span>
                <span className="block text-xs text-muted-foreground">
                  {ai.autoReplyHint}
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
                <span className="block text-sm font-medium text-foreground">{ai.autoSuggest}</span>
                <span className="block text-xs text-muted-foreground">{ai.autoSuggestHint}</span>
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{ai.provider}</label>
              <select
                value={config.provider}
                onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                {providerOptions.map((p) => (
                  <option key={p} value={p}>
                    {ai.providers[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{ai.model}</label>
              <select
                value={config.model}
                onChange={(e) => update('model', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                {modelOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {ai.creativity(config.temperature.toFixed(1))}
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
            <label className="block text-sm font-medium text-foreground mb-1.5">{ai.apiKey}</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder={config._hasApiKey ? ai.apiKeyPlaceholderSaved : ai.apiKeyPlaceholder}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{ai.systemPrompt}</label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              rows={4}
              placeholder={ai.systemPromptPlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-y"
            />
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              {ai.liveTest}
            </h3>
            <textarea
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <Button type="button" variant="secondary" onClick={handleTest} disabled={testing} loading={testing}>
              {testing ? ai.gettingReply : ai.askAi}
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
              {common.save}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
