'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'

interface Campaign {
  id: string
  name: string
  description: string | null
  type: 'EMAIL' | 'IN_APP' | 'BROADCAST'
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  target: string
  subject: string | null
  content: string | null
  scheduledAt: string | null
  sentCount: number
  openCount: number
  clickCount: number
  replyCount: number
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TYPE_COLORS: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_APP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BROADCAST: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function CampaignsPage() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('campaigns')
  const { activeWebsite } = useActiveWebsite()
  const { common, campaigns: camp, dateLocale } = useSettingsI18n()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', type: 'EMAIL' as Campaign['type'],
    subject: '', content: '', target: 'ALL_VISITORS', scheduledAt: '',
  })

  const fetchCampaigns = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/campaigns?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) setCampaigns(await res.json())
    } catch (err) {
      console.error('Failed to fetch campaigns', err)
    } finally {
      setLoading(false)
    }
  }, [activeWebsite])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const handleCreate = async () => {
    if (!activeWebsite) return
    const body: Record<string, unknown> = { ...form, websiteId: activeWebsite.websiteId }
    if (!body.scheduledAt) delete body.scheduledAt

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setShowCreate(false)
      setForm({ name: '', description: '', type: 'EMAIL', subject: '', content: '', target: 'ALL_VISITORS', scheduledAt: '' })
      fetchCampaigns()
    }
  }

  const updateStatus = async (id: string, status: Campaign['status']) => {
    await fetch('/api/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchCampaigns()
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm(camp.confirmDelete)) return
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
    fetchCampaigns()
  }

  const sendCampaign = async (id: string) => {
    if (!confirm(camp.confirmSend)) return
    setSendingId(id)
    try {
      const res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || camp.sendFailed)
        return
      }
      alert(camp.sentSuccess(data.sent ?? 0))
      fetchCampaigns()
    } catch {
      alert(camp.sendFailed)
    } finally {
      setSendingId(null)
    }
  }

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="campaigns" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{camp.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{camp.subtitle}</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary w-full sm:w-auto"
        >
          {camp.createCampaign}
        </button>
      </div>

      {showCreate && (
        <div className="surface p-5 sm:p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{camp.newCampaign}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{camp.campaignName}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder={camp.campaignNamePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{camp.type}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as Campaign['type'] })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                >
                  <option value="EMAIL">{camp.types.EMAIL}</option>
                  <option value="IN_APP">{camp.types.IN_APP}</option>
                  <option value="BROADCAST">{camp.types.BROADCAST}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{common.description}</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder={camp.descriptionPlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{camp.subject}</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder={camp.subjectPlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{camp.content}</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                placeholder={camp.contentPlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{camp.scheduledAt}</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">{common.cancel}</button>
            <button onClick={handleCreate} className="btn-primary">{common.create}</button>
          </div>
        </div>
      )}

      <div className="surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">{camp.emptyTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1">{camp.emptyHint}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{camp.tableCampaign}</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{camp.tableStatus}</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{camp.tableSent}</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{camp.tableOpens}</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{camp.tableClicks}</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{camp.tableReplies}</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{camp.tableActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-muted transition">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground text-sm">{campaign.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${TYPE_COLORS[campaign.type]}`}>{camp.types[campaign.type]}</span>
                          {campaign.scheduledAt && (
                            <span className="text-xs text-muted-foreground">{new Date(campaign.scheduledAt).toLocaleDateString(dateLocale)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[campaign.status]}`}>{camp.statuses[campaign.status]}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{campaign.sentCount}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{campaign.openCount}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{campaign.clickCount}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{campaign.replyCount}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {campaign.status === 'DRAFT' && (
                            <button onClick={() => updateStatus(campaign.id, 'ACTIVE')} className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition">{camp.activate}</button>
                          )}
                          {campaign.status === 'ACTIVE' && campaign.type === 'EMAIL' && (
                            <button
                              onClick={() => sendCampaign(campaign.id)}
                              disabled={sendingId === campaign.id}
                              className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition disabled:opacity-50"
                            >
                              {sendingId === campaign.id ? camp.sending : camp.send}
                            </button>
                          )}
                          {campaign.status === 'ACTIVE' && (
                            <button onClick={() => updateStatus(campaign.id, 'PAUSED')} className="px-3 py-1.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition">{camp.pause}</button>
                          )}
                          {campaign.status === 'PAUSED' && (
                            <button onClick={() => updateStatus(campaign.id, 'ACTIVE')} className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition">{camp.resume}</button>
                          )}
                          {(campaign.status === 'DRAFT' || campaign.status === 'PAUSED') && (
                            <button onClick={() => deleteCampaign(campaign.id)} className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition">{common.delete}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground text-sm min-w-0 break-words">{campaign.name}</p>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full shrink-0 ${STATUS_COLORS[campaign.status]}`}>{camp.statuses[campaign.status]}</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${TYPE_COLORS[campaign.type]}`}>{camp.types[campaign.type]}</span>
                    {campaign.scheduledAt && (
                      <span className="text-xs text-muted-foreground">{new Date(campaign.scheduledAt).toLocaleDateString(dateLocale)}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                    <div><p className="text-sm font-semibold text-foreground">{campaign.sentCount}</p><p className="text-[10px] text-muted-foreground">{camp.tableSent}</p></div>
                    <div><p className="text-sm font-semibold text-foreground">{campaign.openCount}</p><p className="text-[10px] text-muted-foreground">{camp.tableOpens}</p></div>
                    <div><p className="text-sm font-semibold text-foreground">{campaign.clickCount}</p><p className="text-[10px] text-muted-foreground">{camp.tableClicks}</p></div>
                    <div><p className="text-sm font-semibold text-foreground">{campaign.replyCount}</p><p className="text-[10px] text-muted-foreground">{camp.tableReplies}</p></div>
                  </div>
                  {(campaign.status === 'DRAFT' || campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && (
                    <div className="flex items-center flex-wrap gap-2 mt-3">
                      {campaign.status === 'DRAFT' && (
                        <button onClick={() => updateStatus(campaign.id, 'ACTIVE')} className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg transition">{camp.activate}</button>
                      )}
                      {campaign.status === 'ACTIVE' && campaign.type === 'EMAIL' && (
                        <button
                          onClick={() => sendCampaign(campaign.id)}
                          disabled={sendingId === campaign.id}
                          className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg transition disabled:opacity-50"
                        >
                          {sendingId === campaign.id ? camp.sending : camp.send}
                        </button>
                      )}
                      {campaign.status === 'ACTIVE' && (
                        <button onClick={() => updateStatus(campaign.id, 'PAUSED')} className="px-3 py-1.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg transition">{camp.pause}</button>
                      )}
                      {campaign.status === 'PAUSED' && (
                        <button onClick={() => updateStatus(campaign.id, 'ACTIVE')} className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg transition">{camp.resume}</button>
                      )}
                      {(campaign.status === 'DRAFT' || campaign.status === 'PAUSED') && (
                        <button onClick={() => deleteCampaign(campaign.id)} className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition">{common.delete}</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
