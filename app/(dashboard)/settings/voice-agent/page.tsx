'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Mic } from 'lucide-react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'
import { Button } from '@/components/ui/button'

type VoiceAgentConfig = {
  isActive: boolean
  name: string
  greeting: string
  systemPrompt: string
  language: string
  voiceStyle: string
}

const DEFAULT_AGENT: VoiceAgentConfig = {
  isActive: false,
  name: 'Sesli Asistan',
  greeting: 'Merhaba, size nasıl yardımcı olabilirim?',
  systemPrompt: '',
  language: 'tr-TR',
  voiceStyle: 'friendly',
}

export default function VoiceAgentSettingsPage() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('aiAssistant')
  const { activeWebsite } = useActiveWebsite()
  const { common, voiceAgent: va } = useSettingsI18n()
  const websiteId = activeWebsite?.websiteId

  const [agent, setAgent] = useState<VoiceAgentConfig>(DEFAULT_AGENT)
  const [voiceAgentEnabled, setVoiceAgentEnabled] = useState(false)
  const [embedUrl, setEmbedUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!websiteId) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/voice/config?websiteId=${websiteId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.agent) setAgent({ ...DEFAULT_AGENT, ...data.agent })
        if (typeof data.voiceAgentEnabled === 'boolean') setVoiceAgentEnabled(data.voiceAgentEnabled)
        if (data.embedUrl) setEmbedUrl(data.embedUrl)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [websiteId])

  const update = <K extends keyof VoiceAgentConfig>(key: K, value: VoiceAgentConfig[K]) => {
    setAgent((a) => ({ ...a, [key]: value }))
  }

  const handleSave = async () => {
    if (!websiteId) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/voice/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, voiceAgentEnabled, ...agent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || va.saveFailed)
      if (data.agent) setAgent({ ...DEFAULT_AGENT, ...data.agent })
      setMessage({ type: 'success', text: va.saveSuccess })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : va.saveFailed,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="aiAssistant" />
  }

  if (!websiteId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">{va.selectSiteFirst}</div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mic className="h-6 w-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">{va.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{va.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="surface p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={voiceAgentEnabled}
                onChange={(e) => setVoiceAgentEnabled(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary rounded border-border"
              />
              <span>
                <span className="block text-sm font-medium">{va.enable}</span>
                <span className="block text-xs text-muted-foreground">{va.enableHint}</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agent.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
                disabled={!voiceAgentEnabled}
                className="mt-0.5 w-4 h-4 accent-primary rounded border-border disabled:opacity-50"
              />
              <span className="block text-sm font-medium">{va.active}</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">{va.name}</label>
                <input
                  value={agent.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{va.language}</label>
                <input
                  value={agent.language}
                  onChange={(e) => update('language', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{va.greeting}</label>
              <input
                value={agent.greeting}
                onChange={(e) => update('greeting', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{va.systemPrompt}</label>
              <textarea
                value={agent.systemPrompt}
                onChange={(e) => update('systemPrompt', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{va.voiceStyle}</label>
              <select
                value={agent.voiceStyle}
                onChange={(e) => update('voiceStyle', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
              >
                <option value="friendly">friendly</option>
                <option value="professional">professional</option>
                <option value="concise">concise</option>
              </select>
            </div>
          </div>

          {embedUrl && voiceAgentEnabled && (
            <div className="surface p-5 space-y-2">
              <h2 className="text-sm font-semibold">{va.embedTitle}</h2>
              <p className="text-xs text-muted-foreground">{va.embedHint}</p>
              <code className="block text-xs break-all rounded-lg bg-muted p-3">{embedUrl}</code>
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={embedUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {va.openEmbed}
                </a>
              </Button>
            </div>
          )}

          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-destructive'}`}>
              {message.text}
            </p>
          )}

          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? common.saving : common.save}
          </Button>
        </div>
      )}
    </div>
  )
}
