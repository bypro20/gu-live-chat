'use client'

import { useState } from 'react'
import { useChatbots } from '@/lib/hooks/use-chatbots'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'
import AiBotSettings from './ai-bot-settings'

interface BotStep {
  id?: string
  type: string
  message: string
  options?: Array<{ label: string; nextStepId?: string }>
  order: number
}

interface Chatbot {
  id: string
  name: string
  description: string | null
  isActive: boolean
  trigger: string
  steps: BotStep[]
}

const STEP_ICONS: Record<string, string> = {
  MESSAGE: '💬',
  CHOICE: '🔘',
  COLLECT_EMAIL: '📧',
  COLLECT_NAME: '👤',
  ASSIGN_AGENT: '👥',
  END: '✅',
}

export default function ChatbotPage() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('chatbot')
  const { chatbots, isLoading, createChatbot, deleteChatbot, toggleChatbot } = useChatbots()
  const { common, chatbot: cb } = useSettingsI18n()
  const [showBuilder, setShowBuilder] = useState(false)
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [botName, setBotName] = useState('')
  const [botTrigger, setBotTrigger] = useState('ALL_CONVERSATIONS')
  const [botTriggerValue, setBotTriggerValue] = useState('')
  const [steps, setSteps] = useState<BotStep[]>([
    { type: 'MESSAGE', message: cb.defaultWelcome, order: 0 },
  ])

  const handleCreate = async () => {
    if (!botName.trim() || saving) return
    setSaving(true)
    setCreateError(null)
    try {
      await createChatbot({
        name: botName.trim(),
        trigger: botTrigger,
        triggerValue: botTrigger === 'KEYWORD' ? botTriggerValue.trim() : undefined,
        steps: steps.map((s, i) => ({
          type: s.type,
          message: s.message || undefined,
          order: i,
          options: s.options?.length ? s.options : undefined,
        })),
      })
      setShowBuilder(false)
      setBotName('')
      setBotTrigger('ALL_CONVERSATIONS')
      setBotTriggerValue('')
      setSteps([{ type: 'MESSAGE', message: cb.defaultWelcome, order: 0 }])
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : cb.createFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(cb.confirmDelete)) return
    try {
      await deleteChatbot(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : cb.deleteFailed)
    }
  }

  const addStep = (type: string) => {
    setSteps([...steps, { type, message: '', order: steps.length }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })))
  }

  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="chatbot" />
  }

  const stepTypes = cb.stepTypes
  const triggerLabels = cb.triggers

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{cb.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{cb.subtitle}</p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="btn-primary w-full sm:w-auto"
        >
          {cb.newChatbot}
        </button>
      </div>

      {/* AI Assistant Settings */}
      <AiBotSettings />

      {/* Chatbot Builder */}
      {showBuilder && (
        <div className="surface p-5 sm:p-6 mb-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{cb.botName}</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder={cb.botNamePlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{common.trigger}</label>
              <select
                value={botTrigger}
                onChange={(e) => setBotTrigger(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                {Object.entries(triggerLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {botTrigger === 'KEYWORD' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{cb.keywords}</label>
                <input
                  type="text"
                  value={botTriggerValue}
                  onChange={(e) => setBotTriggerValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder={cb.keywordsPlaceholder}
                />
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-foreground">{cb.flowSteps}</h3>
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted rounded-xl border border-border">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{STEP_ICONS[step.type]}</span>
                    <span className="text-sm font-medium text-foreground">{stepTypes[step.type]?.label}</span>
                  </div>
                  {(step.type === 'MESSAGE' || step.type === 'COLLECT_EMAIL' || step.type === 'COLLECT_NAME' || step.type === 'ASSIGN_AGENT') && (
                    <input
                      type="text"
                      value={step.message}
                      onChange={(e) => updateStep(index, 'message', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder={step.type === 'MESSAGE' ? cb.messagePlaceholder : step.type === 'ASSIGN_AGENT' ? cb.transferPlaceholder : cb.promptPlaceholder}
                    />
                  )}
                  {step.type === 'CHOICE' && (
                    <div className="space-y-2">
                      {step.options?.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div className="w-5 h-5 shrink-0 rounded-full border-2 border-primary flex items-center justify-center text-xs text-primary">
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const updated = [...steps]
                              const options = [...(updated[index].options || [])]
                              options[optIndex] = { ...options[optIndex], label: e.target.value }
                              updated[index] = { ...updated[index], options }
                              setSteps(updated)
                            }}
                            className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder={cb.optionText}
                          />
                          <button
                            onClick={() => {
                              const updated = [...steps]
                              const options = (updated[index].options || []).filter((_, i) => i !== optIndex)
                              updated[index] = { ...updated[index], options }
                              setSteps(updated)
                            }}
                            className="text-destructive hover:opacity-80 text-sm shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const updated = [...steps]
                          const options = [...(updated[index].options || []), { label: '' }]
                          updated[index] = { ...updated[index], options }
                          setSteps(updated)
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {cb.addOption}
                      </button>
                    </div>
                  )}
                </div>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(index)} className="text-muted-foreground hover:text-destructive transition shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Step Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(stepTypes).map(([type, info]) => (
              <button
                key={type}
                onClick={() => addStep(type)}
                className="px-3 py-2 bg-muted hover:bg-accent rounded-lg text-sm transition flex items-center gap-1.5 text-foreground"
              >
                <span>{STEP_ICONS[type]}</span>
                <span>{info.label}</span>
              </button>
            ))}
          </div>

          {createError && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-2.5">
              {createError}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button onClick={() => { setShowBuilder(false); setCreateError(null) }} className="btn-secondary">
              {common.cancel}
            </button>
            <button onClick={handleCreate} disabled={saving || !botName.trim()} className="btn-primary disabled:opacity-50">
              {saving ? common.saving : cb.createChatbot}
            </button>
          </div>
        </div>
      )}

      {/* Existing Chatbots */}
      <div className="surface">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chatbots.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🤖
            </div>
            <h3 className="font-medium text-foreground">{cb.emptyTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1">{cb.emptyHint}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chatbots.map((bot: Chatbot) => (
              <div key={bot.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${bot.isActive ? 'bg-success-light' : 'bg-muted'}`}>
                    🤖
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{bot.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{triggerLabels[bot.trigger]} • {cb.stepCount(bot.steps.length)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleChatbot(bot.id, !bot.isActive).catch((e) => alert(e.message))}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${bot.isActive ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}
                  >
                    {bot.isActive ? common.active : common.inactive}
                  </button>
                  <button onClick={() => handleDelete(bot.id)} className="text-muted-foreground hover:text-destructive transition text-sm">{common.delete}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}