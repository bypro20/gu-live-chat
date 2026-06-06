'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'

interface WorkflowStep {
  id?: string
  order: number
  actionType: string
  config: string | null
  delayMs: number | null
}

interface Workflow {
  id: string
  name: string
  description: string | null
  isActive: boolean
  triggerType: string
  triggerConfig: string | null
  order: number
  steps: WorkflowStep[]
}

const TRIGGER_LABELS: Record<string, string> = {
  CONVERSATION_CREATED: 'Görüşme Oluşturuldu',
  CONVERSATION_RESOLVED: 'Görüşme Çözüldü',
  CONVERSATION_CLOSED: 'Görüşme Kapatıldı',
  MESSAGE_RECEIVED: 'Mesaj Alındı',
  VISITOR_CREATED: 'Ziyaretçi Oluşturuldu',
  VISITOR_SEEN_PAGE: 'Sayfa Görüntülendi',
  TICKET_CREATED: 'Bilet Oluşturuldu',
  TICKET_UPDATED: 'Bilet Güncellendi',
  SCHEDULED: 'Zamanlanmış',
  WEBHOOK_RECEIVED: 'Webhook Alındı',
}

const ACTION_LABELS: Record<string, string> = {
  SEND_MESSAGE: 'Mesaj Gönder',
  SEND_EMAIL: 'E-posta Gönder',
  ASSIGN_AGENT: 'Temsilci Ata',
  CHANGE_STATUS: 'Durumu Değiştir',
  SET_PRIORITY: 'Öncelik Belirle',
  ADD_TAG: 'Etiket Ekle',
  REMOVE_TAG: 'Etiket Kaldır',
  FORWARD_TO_WEBHOOK: 'Webhook\'a İlet',
  ADD_NOTE: 'Not Ekle',
  TRIGGER_CHATBOT: 'Chatbot Tetikle',
  SEND_NOTIFICATION: 'Bildirim Gönder',
  DELAY: 'Bekleme',
  CONDITIONAL_BRANCH: 'Koşullu Dal',
}

const ACTION_COLORS: Record<string, string> = {
  SEND_MESSAGE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SEND_EMAIL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ASSIGN_AGENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CHANGE_STATUS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  SET_PRIORITY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ADD_TAG: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  REMOVE_TAG: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  FORWARD_TO_WEBHOOK: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ADD_NOTE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  TRIGGER_CHATBOT: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  SEND_NOTIFICATION: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  DELAY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONDITIONAL_BRANCH: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const TRIGGER_COLORS: Record<string, string> = {
  CONVERSATION_CREATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CONVERSATION_RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CONVERSATION_CLOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MESSAGE_RECEIVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  VISITOR_CREATED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  VISITOR_SEEN_PAGE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  TICKET_CREATED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  TICKET_UPDATED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SCHEDULED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  WEBHOOK_RECEIVED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

const AVAILABLE_ACTIONS = Object.keys(ACTION_LABELS).map((key) => ({
  value: key,
  label: ACTION_LABELS[key],
}))

export default function WorkflowsPage() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('workflows')
  const { activeWebsite } = useActiveWebsite()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', triggerType: 'CONVERSATION_CREATED', triggerConfig: '',
  })
  const [steps, setSteps] = useState<{ actionType: string; config: string; delayMs: string }[]>([])

  const fetchWorkflows = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/workflows?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) setWorkflows(await res.json())
    } catch (err) {
      console.error('Failed to fetch workflows', err)
    } finally {
      setLoading(false)
    }
  }, [activeWebsite])

  useEffect(() => { fetchWorkflows() }, [fetchWorkflows])

  const resetForm = () => {
    setForm({ name: '', description: '', triggerType: 'CONVERSATION_CREATED', triggerConfig: '' })
    setSteps([])
    setEditingId(null)
    setShowCreate(false)
  }

  const handleCreate = async () => {
    if (!activeWebsite) return
    const body = {
      ...form,
      websiteId: activeWebsite.websiteId,
      steps: steps.map((s, i) => ({
        order: i,
        actionType: s.actionType,
        config: s.config || null,
        delayMs: s.delayMs ? parseInt(s.delayMs) : null,
      })),
    }

    const res = await fetch('/api/workflows', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingId ? { ...body, id: editingId } : body),
    })

    if (res.ok) {
      resetForm()
      fetchWorkflows()
    }
  }

  const toggleActive = async (wf: Workflow) => {
    await fetch('/api/workflows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wf.id, isActive: !wf.isActive }),
    })
    fetchWorkflows()
  }

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Bu iş akışını silmek istediğinize emin misiniz?')) return
    await fetch(`/api/workflows?id=${id}`, { method: 'DELETE' })
    fetchWorkflows()
  }

  const addStep = () => {
    setSteps([...steps, { actionType: 'SEND_MESSAGE', config: '', delayMs: '' }])
  }

  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const startEdit = (wf: Workflow) => {
    setForm({ name: wf.name, description: wf.description || '', triggerType: wf.triggerType, triggerConfig: wf.triggerConfig || '' })
    setSteps(wf.steps.map((s) => ({ actionType: s.actionType, config: s.config || '', delayMs: s.delayMs?.toString() || '' })))
    setEditingId(wf.id)
    setShowCreate(true)
  }

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="workflows" />
  }

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="workflows" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Otomasyonlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Tekrarlayan işleri otomatikleştirin</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true) }}
          className="btn-primary w-full sm:w-auto"
        >
          + İş Akışı Oluştur
        </button>
      </div>

      {showCreate && (
        <div className="surface p-5 sm:p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? 'İş Akışını Düzenle' : 'Yeni İş Akışı'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">İş Akışı Adı</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="İş akışı adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tetikleyici</label>
                <select
                  value={form.triggerType}
                  onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                >
                  {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Açıklama</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Açıklama"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Adımlar</label>
                <button onClick={addStep} className="text-xs font-medium text-primary hover:text-primary-hover transition">+ Adım Ekle</button>
              </div>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-muted rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{index + 1}</span>
                      <select
                        value={step.actionType}
                        onChange={(e) => updateStep(index, 'actionType', e.target.value)}
                        className="flex-1 sm:flex-initial sm:w-auto px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      >
                        {AVAILABLE_ACTIONS.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                      <button onClick={() => removeStep(index)} className="p-1.5 text-muted-foreground hover:text-destructive transition shrink-0 sm:hidden ml-auto">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={step.config}
                      onChange={(e) => updateStep(index, 'config', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Yapılandırma"
                    />
                    <input
                      type="number"
                      value={step.delayMs}
                      onChange={(e) => updateStep(index, 'delayMs', e.target.value)}
                      className="w-full sm:w-28 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Gecikme ms"
                    />
                    <button onClick={() => removeStep(index)} className="p-1.5 text-muted-foreground hover:text-destructive transition shrink-0 hidden sm:block">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {steps.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Henüz adım eklenmedi</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button onClick={resetForm} className="btn-secondary">İptal</button>
            <button onClick={handleCreate} className="btn-primary">
              {editingId ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </div>
      )}

      <div className="surface">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Henüz iş akışı yok</h3>
            <p className="text-sm text-muted-foreground mt-1">İlk otomasyonunuzu oluşturun</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {workflows.map((wf) => (
              <div key={wf.id} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-semibold text-foreground">{wf.name}</h3>
                      <span className={`px-2.5 py-0.5 text-xs rounded-full ${TRIGGER_COLORS[wf.triggerType] || 'bg-muted text-muted-foreground'}`}>
                        {TRIGGER_LABELS[wf.triggerType] || wf.triggerType}
                      </span>
                    </div>
                    {wf.description && (
                      <p className="text-sm text-muted-foreground mt-1">{wf.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-muted-foreground hidden sm:inline">{wf.isActive ? 'Aktif' : 'Pasif'}</span>
                      <button
                        onClick={() => toggleActive(wf)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${wf.isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${wf.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </label>
                    <button onClick={() => startEdit(wf)} className="p-1.5 text-muted-foreground hover:text-primary transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteWorkflow(wf.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {wf.steps.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {wf.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 text-xs rounded-lg ${ACTION_COLORS[step.actionType] || 'bg-muted text-muted-foreground'}`}>
                          {ACTION_LABELS[step.actionType] || step.actionType}
                        </span>
                        {step.delayMs && (
                          <span className="text-xs text-muted-foreground">({step.delayMs}ms)</span>
                        )}
                        {idx < wf.steps.length - 1 && (
                          <svg className="w-4 h-4 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
