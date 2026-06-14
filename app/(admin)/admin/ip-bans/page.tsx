'use client'

import { useEffect, useState, useCallback } from 'react'
import { Ban, Plus, Trash2, X, Clock, Hash, Loader2, Search, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/lib/toast'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

interface IpBan {
  id: string
  ipAddress: string
  reason: string | null
  bannedBy: string | null
  expiresAt: string | null
  createdAt: string
}

export default function AdminIpBansPage() {
  const { toast } = useToast()
  const [bans, setBans] = useState<IpBan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<IpBan | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [newIp, setNewIp] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newExpires, setNewExpires] = useState('')

  const loadBans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ip-bans')
      if (res.ok) {
        setBans(await res.json())
      } else {
        toast({ title: 'IP engelleri yüklenemedi', variant: 'error' })
      }
    } catch {
      toast({ title: 'Bağlantı hatası', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadBans() }, [loadBans])

  const filtered = bans.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return b.ipAddress.includes(q) || (b.reason || '').toLowerCase().includes(q)
  })

  async function handleAdd() {
    if (!newIp.trim()) return
    setActionLoading('add')
    try {
      const res = await fetch('/api/admin/ip-bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: newIp.trim(),
          reason: newReason || undefined,
          expiresAt: newExpires ? new Date(newExpires).toISOString() : null,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setBans(prev => [created, ...prev])
        setShowAddModal(false)
        setNewIp('')
        setNewReason('')
        setNewExpires('')
        toast({ title: 'IP engellendi', description: newIp, variant: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || 'IP engellenemedi', variant: 'error' })
      }
    } catch {
      toast({ title: 'İşlem başarısız', variant: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(ban: IpBan) {
    setActionLoading(`delete-${ban.id}`)
    try {
      const res = await fetch(`/api/admin/ip-bans?ipAddress=${encodeURIComponent(ban.ipAddress)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setBans(prev => prev.filter(b => b.id !== ban.id))
        setShowDeleteModal(null)
        toast({ title: 'IP engeli kaldırıldı', description: ban.ipAddress, variant: 'success' })
      } else {
        toast({ title: 'Engel kaldırılamadı', variant: 'error' })
      }
    } catch {
      toast({ title: 'İşlem başarısız', variant: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  function isExpired(ban: IpBan) {
    return ban.expiresAt && new Date(ban.expiresAt) < new Date()
  }

  return (
    <div className="admin-page space-y-6">
      <AdminPageHeader
        title="IP Engelleme"
        description={`Toplam ${bans.length} engelli IP adresi`}
      >
        <Button onClick={() => setShowAddModal(true)} size="lg">
          <Plus className="size-4" />
          IP Engelle
        </Button>
      </AdminPageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 admin-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="IP veya sebep ara..."
          className="admin-form-input h-10 pl-10 pr-4"
        />
      </div>

      <div className="admin-table-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 admin-text-muted gap-2">
              <Loader2 className="size-5 animate-spin" />
              Yükleniyor...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 admin-text-muted">
              <Shield className="size-8 mb-2 opacity-40" />
              Engelli IP bulunamadı
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--admin-border)' }}>
                  {['IP Adresi', 'Sebep', 'Engellenme', 'Bitiş', 'İşlem'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold admin-text-muted uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
                {filtered.map((ban, i) => (
                  <tr
                    key={ban.id}
                    className={cn(
                      'transition-colors hover:bg-[var(--admin-bg-hover)]',
                      isExpired(ban) && 'opacity-50',
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Hash className="size-3.5 admin-text-muted" />
                        <span className="text-sm font-mono admin-text">{ban.ipAddress}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm admin-text-secondary">{ban.reason || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm admin-text-secondary">
                        {new Date(ban.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {ban.expiresAt ? (
                        <Badge variant={isExpired(ban) ? 'secondary' : 'warning'}>
                          <Clock className="size-3" />
                          {new Date(ban.expiresAt).toLocaleString('tr-TR')}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <Ban className="size-3" />
                          Süresiz
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setShowDeleteModal(ban)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 admin-modal-backdrop" />
          <div
            className="relative w-full max-w-md admin-modal-panel border rounded-2xl shadow-2xl p-6 space-y-5 animate-in-scale"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">IP Engelle</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">IP Adresi</label>
                <Input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sebep (isteğe bağlı)</label>
                <Textarea value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Engelleme sebebi..." rows={2} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bitiş Tarihi (isteğe bağlı)</label>
                <Input type="datetime-local" value={newExpires} onChange={e => setNewExpires(e.target.value)} />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>İptal</Button>
              <Button variant="destructive" onClick={handleAdd} loading={actionLoading === 'add'}>
                <Ban className="size-3.5" />
                Engelle
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(null)}>
          <div className="absolute inset-0 admin-modal-backdrop" />
          <div
            className="relative w-full max-w-md admin-modal-panel border rounded-2xl shadow-2xl p-6 space-y-5 animate-in-scale"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">IP Engelini Kaldır</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono text-foreground">{showDeleteModal.ipAddress}</span> adresinin engelini kaldırmak istediğinize emin misiniz?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>İptal</Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(showDeleteModal)}
                loading={actionLoading === `delete-${showDeleteModal.id}`}
              >
                Kaldır
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
