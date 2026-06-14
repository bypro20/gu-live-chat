'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search, Shield, Ban, VolumeX, Trash2, UserPlus, Globe, Mail,
  Calendar, MoreHorizontal, X, Check, AlertTriangle, Filter,
  ArrowUpDown, Clock, UserCheck, UserX, Hash, Loader2, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/lib/toast'

interface Website {
  id: string
  name: string
  domain: string
}

interface GeoInfo {
  country: string | null
  countryCode: string | null
  city: string | null
  region: string | null
  isp: string | null
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  bannedAt: string | null
  banReason: string | null
  mutedUntil: string | null
  lastSeen: string | null
  lastIp: string | null
  createdAt: string
  _count: { ownedWebsites: number }
  ownedWebsites?: Website[]
  geo?: GeoInfo | null
}

interface BanModalData {
  userId: string
  userName: string
}

interface MuteModalData {
  userId: string
  userName: string
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('TUMU')
  const [statusFilter, setStatusFilter] = useState('TUMU')
  const [sortBy, setSortBy] = useState('createdAt')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showMuteModal, setShowMuteModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showIpBanModal, setShowIpBanModal] = useState(false)
  const [banData, setBanData] = useState<BanModalData | null>(null)
  const [muteData, setMuteData] = useState<MuteModalData | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banIpToo, setBanIpToo] = useState(false)
  const [muteDuration, setMuteDuration] = useState('1h')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [addEmail, setAddEmail] = useState('')
  const [addName, setAddName] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addRole, setAddRole] = useState('USER')

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        setUsers(await res.json())
      } else {
        toast({ title: 'Kullanıcılar yüklenemedi', variant: 'error' })
      }
    } catch {
      toast({ title: 'Bağlantı hatası', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadUserDetail = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const detail = await res.json()
        setSelectedUser(detail)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...detail } : u))
      }
    } catch {
      // Detail panel still works with list data
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const filteredUsers = users
    .filter(u => {
      const q = search.toLowerCase()
      const matchesSearch = !search ||
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q))
      const matchesRole = roleFilter === 'TUMU' || u.role === roleFilter
      const matchesStatus = statusFilter === 'TUMU' || u.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '')
        case 'email': return a.email.localeCompare(b.email)
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  async function apiAction(userId: string, action: string, extra?: object) {
    setActionLoading(`${action}-${userId}`)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u))
        if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, ...updated } : null)
        toast({ title: 'İşlem başarılı', variant: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || 'İşlem başarısız', variant: 'error' })
      }
    } catch {
      toast({ title: 'Bağlantı hatası', variant: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreateUser() {
    if (!addEmail || !addPassword) return
    setActionLoading('create')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, name: addName, password: addPassword, role: addRole }),
      })
      if (res.ok) {
        const created = await res.json()
        setUsers(prev => [created, ...prev])
        setShowAddModal(false)
        setAddEmail('')
        setAddName('')
        setAddPassword('')
        setAddRole('USER')
        toast({ title: 'Kullanıcı oluşturuldu', description: created.email, variant: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || 'Kullanıcı oluşturulamadı', variant: 'error' })
      }
    } catch {
      toast({ title: 'Bağlantı hatası', variant: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return
    setActionLoading('delete')
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
        setShowDeleteModal(false)
        setSelectedUser(null)
        setShowDetail(false)
        toast({ title: 'Kullanıcı silindi', variant: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || 'Silme başarısız', variant: 'error' })
      }
    } catch {
      toast({ title: 'Bağlantı hatası', variant: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBan() {
    if (!banData) return
    setActionLoading('ban')
    try {
      const res = await fetch(`/api/admin/users/${banData.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ban', reason: banReason, banIp: banIpToo }),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers(prev => prev.map(u => u.id === banData.userId ? { ...u, ...updated } : u))
        if (selectedUser?.id === banData.userId) setSelectedUser(prev => prev ? { ...prev, ...updated } : null)
        setShowBanModal(false)
        setBanReason('')
        setBanIpToo(false)
        setBanData(null)
        toast({ title: 'Kullanıcı banlandı', variant: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || 'Ban işlemi başarısız', variant: 'error' })
      }
    } catch {
      toast({ title: 'Bağlantı hatası', variant: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleMute() {
    if (!muteData) return
    setActionLoading('mute')
    const durations: Record<string, number | null> = {
      '1h': 3600, '6h': 21600, '24h': 86400, '7d': 604800, 'forever': null
    }
    try {
      const res = await fetch(`/api/admin/users/${muteData.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mute', durationSeconds: durations[muteDuration] }),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers(prev => prev.map(u => u.id === muteData.userId ? { ...u, ...updated } : u))
        if (selectedUser?.id === muteData.userId) setSelectedUser(prev => prev ? { ...prev, ...updated } : null)
        setShowMuteModal(false)
        setMuteData(null)
        setMuteDuration('1h')
        toast({ title: 'Kullanıcı susturuldu', variant: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || 'Susturma başarısız', variant: 'error' })
      }
    } catch {
      toast({ title: 'Bağlantı hatası', variant: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  function getStatusInfo(user: User) {
    const now = new Date()
    const mutedUntil = user.mutedUntil ? new Date(user.mutedUntil) : null
    const isMuted = mutedUntil && mutedUntil > now
    const isBanned = user.status === 'BANNED'
    const isOnline = user.lastSeen && (now.getTime() - new Date(user.lastSeen).getTime() < 60000)

    if (isBanned) return { label: 'Banlı', variant: 'destructive' as const, icon: '⛔' }
    if (isMuted) return { label: 'Susturuldu', variant: 'warning' as const, icon: '🔇' }
    if (isOnline) return { label: 'Çevrimiçi', variant: 'success' as const, icon: '🟢' }
    return { label: 'Aktif', variant: 'success' as const, icon: '🟢' }
  }

  function MuteDurationLabel(seconds: number | null) {
    if (seconds === null) return 'Süresiz'
    if (seconds === 3600) return '1 saat'
    if (seconds === 21600) return '6 saat'
    if (seconds === 86400) return '24 saat'
    if (seconds === 604800) return '7 gün'
    return null
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Toplam {users.length} kullanıcı</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="lg">
          <UserPlus className="size-4" />
          Yeni Kullanıcı Ekle
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ara..."
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring"
          >
            <option value="TUMU">Tümü</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">Kullanıcı</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring"
          >
            <option value="TUMU">Tümü</option>
            <option value="ACTIVE">Aktif</option>
            <option value="BANNED">Banlı</option>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring"
          >
            <option value="createdAt">Kayıt Tarihi</option>
            <option value="name">İsim</option>
            <option value="email">E-posta</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin" />
              Yükleniyor...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="size-8 mb-2 opacity-40" />
              Kullanıcı bulunamadı
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Kullanıcı', 'Rol', 'Siteler', 'Durum', 'Kayıt Tarihi', 'İşlemler'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user, i) => {
                  const status = getStatusInfo(user)
                  return (
                    <tr
                      key={user.id}
                      onClick={() => { setSelectedUser(user); setShowDetail(true); loadUserDetail(user.id) }}
                      className={cn(
                        'group cursor-pointer transition-all duration-300 hover:bg-accent/50',
                        'animate-in-up',
                      )}
                      style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar fallback={user.name || user.email} size="md" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name || 'İsimsiz'}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="size-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                          <Shield className="size-3" />
                          {user.role === 'ADMIN' ? 'Admin' : 'Kullanıcı'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Globe className="size-3.5" />
                          {user._count?.ownedWebsites || 0}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={status.variant}>
                          {status.icon} {status.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="size-3.5" />
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => { setSelectedUser(user); setShowDetail(true); loadUserDetail(user.id) }}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Detail Panel Overlay */}
      {showDetail && selectedUser && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowDetail(false)}>
          <div className="absolute inset-0 admin-modal-backdrop" />
          <div
            className={cn(
              'relative ml-auto w-full max-w-lg h-full overflow-y-auto admin-modal-panel border-l shadow-2xl',
              'animate-in-scale'
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 admin-modal-panel border-b px-6 py-4 flex items-center justify-between z-10" style={{ borderColor: 'var(--admin-border)' }}>
              <h2 className="text-lg font-semibold">Kullanıcı Detayı</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDetail(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar fallback={selectedUser.name || selectedUser.email} size="xl" />
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name || 'İsimsiz'}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="size-3.5" />
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rol</p>
                  <Badge variant={selectedUser.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                    <Shield className="size-3" />
                    {selectedUser.role === 'ADMIN' ? 'Admin' : 'Kullanıcı'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Durum</p>
                  <Badge variant={getStatusInfo(selectedUser).variant}>
                    {getStatusInfo(selectedUser).icon} {getStatusInfo(selectedUser).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Kayıt Tarihi</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {new Date(selectedUser.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Son Görülme</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.lastSeen
                      ? new Date(selectedUser.lastSeen).toLocaleString('tr-TR')
                      : 'Hiç görülmedi'}
                  </p>
                </div>
                {selectedUser.lastIp && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">IP Adresi</p>
                    <p className="text-sm font-mono">{selectedUser.lastIp}</p>
                  </div>
                )}
                {selectedUser.geo && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Konum</p>
                    <p className="text-sm flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" />
                      {[selectedUser.geo.city, selectedUser.geo.region, selectedUser.geo.country].filter(Boolean).join(', ') || 'Bilinmiyor'}
                      {selectedUser.geo.isp && (
                        <span className="text-xs text-muted-foreground">({selectedUser.geo.isp})</span>
                      )}
                    </p>
                  </div>
                )}
                {selectedUser.banReason && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Ban Sebebi</p>
                    <p className="text-sm text-destructive">{selectedUser.banReason}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Websites */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <Globe className="size-4" />
                  Siteler ({selectedUser._count?.ownedWebsites || 0})
                </h4>
                {selectedUser.ownedWebsites && selectedUser.ownedWebsites.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.ownedWebsites.map(ws => (
                      <div key={ws.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                        <div>
                          <p className="text-sm font-medium">{ws.name}</p>
                          <p className="text-xs text-muted-foreground">{ws.domain}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Bu kullanıcıya ait site bulunmuyor.</p>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yönetim İşlemleri</p>

                <div className="grid grid-cols-2 gap-2">
                  {selectedUser.role === 'ADMIN' ? (
                    <Button variant="secondary" size="sm" className="w-full" loading={actionLoading === `role-${selectedUser.id}`} onClick={() => apiAction(selectedUser.id, 'role', { role: 'USER' })}>
                      <UserCheck className="size-3.5" />
                      Kullanıcı Yap
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" className="w-full" loading={actionLoading === `role-${selectedUser.id}`} onClick={() => apiAction(selectedUser.id, 'role', { role: 'ADMIN' })}>
                      <Shield className="size-3.5" />
                      Admin Yap
                    </Button>
                  )}

                  {selectedUser.status === 'BANNED' ? (
                    <Button variant="success" size="sm" className="w-full" loading={actionLoading === `unban-${selectedUser.id}`} onClick={() => apiAction(selectedUser.id, 'unban')}>
                      <Check className="size-3.5" />
                      Banı Kaldır
                    </Button>
                  ) : (
                    <Button variant="destructive" size="sm" className="w-full" onClick={() => { setBanData({ userId: selectedUser.id, userName: selectedUser.name || selectedUser.email }); setShowBanModal(true) }}>
                      <Ban className="size-3.5" />
                      Banla
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" className="w-full text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" onClick={() => { setMuteData({ userId: selectedUser.id, userName: selectedUser.name || selectedUser.email }); setShowMuteModal(true) }}>
                    <VolumeX className="size-3.5" />
                    Sustur
                  </Button>

                  {selectedUser.lastIp && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowIpBanModal(true)}>
                      <Hash className="size-3.5" />
                      IP Banla
                    </Button>
                  )}
                </div>

                <Button variant="destructive" size="sm" className="w-full" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="size-3.5" />
                  Kullanıcıyı Sil
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 admin-modal-backdrop" />
          <div
            className={cn(
              'relative w-full max-w-md admin-modal-panel border rounded-2xl shadow-2xl p-6 space-y-5',
              'animate-in-scale'
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Yeni Kullanıcı Oluştur</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <Input value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="ornek@email.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ad Soyad</label>
                <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Ad Soyad" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Şifre</label>
                <Input type="password" value={addPassword} onChange={e => setAddPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <select
                  value={addRole}
                  onChange={e => setAddRole(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring"
                >
                  <option value="USER">Kullanıcı</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>İptal</Button>
              <Button onClick={handleCreateUser} loading={actionLoading === 'create'}>Oluştur</Button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && banData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowBanModal(false)}>
          <div className="absolute inset-0 admin-modal-backdrop" />
          <div
            className={cn(
              'relative w-full max-w-md admin-modal-panel border rounded-2xl shadow-2xl p-6 space-y-5',
              'animate-in-scale'
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-destructive-light">
                <Ban className="size-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Kullanıcıyı Banla</h2>
                <p className="text-sm text-muted-foreground">{banData.userName}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ban Sebebi</label>
                <Textarea
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder="Ban sebebini açıklayın..."
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={banIpToo}
                  onChange={e => setBanIpToo(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-sm text-foreground">IP adresini de banla</span>
              </label>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowBanModal(false); setBanReason(''); setBanIpToo(false) }}>İptal</Button>
              <Button variant="destructive" onClick={handleBan} loading={actionLoading === 'ban'}>
                <Ban className="size-3.5" />
                Banla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mute Modal */}
      {showMuteModal && muteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowMuteModal(false)}>
          <div className="absolute inset-0 admin-modal-backdrop" />
          <div
            className={cn(
              'relative w-full max-w-md admin-modal-panel border rounded-2xl shadow-2xl p-6 space-y-5',
              'animate-in-scale'
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-warning-light">
                <VolumeX className="size-5 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Kullanıcıyı Sustur</h2>
                <p className="text-sm text-muted-foreground">{muteData.userName}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium">Süre</label>
              <select
                value={muteDuration}
                onChange={e => setMuteDuration(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring"
              >
                <option value="1h">1 saat</option>
                <option value="6h">6 saat</option>
                <option value="24h">24 saat</option>
                <option value="7d">7 gün</option>
                <option value="forever">Süresiz</option>
              </select>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowMuteModal(false); setMuteDuration('1h') }}>İptal</Button>
              <Button variant="secondary" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" onClick={handleMute} loading={actionLoading === 'mute'}>
                <VolumeX className="size-3.5" />
                Sustur
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* IP Ban Modal */}
      {showIpBanModal && selectedUser?.lastIp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowIpBanModal(false)}>
          <div className="absolute inset-0 admin-modal-backdrop" />
          <div
            className={cn(
              'relative w-full max-w-md admin-modal-panel border rounded-2xl shadow-2xl p-6 space-y-5',
              'animate-in-scale'
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-destructive-light">
                <Hash className="size-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">IP Banla</h2>
                <p className="text-sm text-muted-foreground">{selectedUser.name || selectedUser.email}</p>
              </div>
            </div>
            <Separator />
            <p className="text-sm text-foreground">
              Bu kullanıcının IP adresini banlamak istediğinize emin misiniz?
            </p>
            <div className="p-3 rounded-xl bg-muted border border-border">
              <p className="text-sm font-mono text-foreground">{selectedUser.lastIp}</p>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowIpBanModal(false)}>İptal</Button>
              <Button variant="destructive" onClick={() => { apiAction(selectedUser.id, 'banIp'); setShowIpBanModal(false) }} loading={actionLoading === `banIp-${selectedUser.id}`}>
                <Ban className="size-3.5" />
                IP Banla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 admin-modal-backdrop" />
          <div
            className={cn(
              'relative w-full max-w-md admin-modal-panel border rounded-2xl shadow-2xl p-6 space-y-5',
              'animate-in-scale'
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-destructive-light">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Kullanıcıyı Sil</h2>
                <p className="text-sm text-muted-foreground">{selectedUser.name || selectedUser.email}</p>
              </div>
            </div>
            <Separator />
            <p className="text-sm text-foreground">
              Bu işlem geri alınamaz. Kullanıcıya ait tüm veriler kalıcı olarak silinecektir. Devam etmek istediğinize emin misiniz?
            </p>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>İptal</Button>
              <Button variant="destructive" onClick={handleDeleteUser} loading={actionLoading === 'delete'}>
                <Trash2 className="size-3.5" />
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
