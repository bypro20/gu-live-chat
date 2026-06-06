'use client'

import { useState } from 'react'
import { useTeam } from '@/lib/hooks/use-team'

interface TeamMember {
  id: string
  role: string
  user: { id: string; name: string | null; email: string; image: string | null }
  acceptedAt: string | null
}

export default function TeamPage() {
  const { members, isLoading, inviteMember, removeMember } = useTeam()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [showInvite, setShowInvite] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const roleLabels: Record<string, { label: string; color: string }> = {
    OWNER: { label: 'Sahip', color: 'bg-primary-light text-primary' },
    ADMIN: { label: 'Yönetici', color: 'bg-primary-light text-primary' },
    MEMBER: { label: 'Temsilci', color: 'bg-muted text-muted-foreground' },
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setMessage({ type: 'error', text: 'E-posta adresi gerekli' })
      return
    }
    try {
      await inviteMember(inviteEmail.trim(), inviteRole)
      setInviteEmail('')
      setInviteRole('MEMBER')
      setShowInvite(false)
      setMessage({ type: 'success', text: 'Davet gönderildi!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Davet gönderilemedi' })
    }
  }

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId)
    try {
      await removeMember(memberId)
      setMessage({ type: 'success', text: 'Üye kaldırıldı' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kaldırma başarısız' })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Takım Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Temsilcileri yönetin ve yeni üyeler davet edin</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="btn-primary w-full sm:w-auto"
        >
          + Üye Davet Et
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-success-light text-success'
            : 'bg-destructive-light text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      {/* Invite Form */}
      {showInvite && (
        <div className="surface p-5 sm:p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Yeni Üye Davet Et</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="E-posta adresi"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            >
              <option value="MEMBER">Temsilci</option>
              <option value="ADMIN">Yönetici</option>
            </select>
            <button
              onClick={handleInvite}
              className="btn-primary shrink-0"
            >
              Davet Gönder
            </button>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="surface overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Henüz takım üyesi yok</h3>
            <p className="text-sm text-muted-foreground mt-1">Yukarıdaki butonu kullanarak üye davet edin</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(members as unknown as TeamMember[]).map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 bg-primary-light rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                    {member.user?.name?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{member.user?.name || 'İsimsiz'}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleLabels[member.role]?.color || roleLabels.MEMBER.color}`}>
                    {roleLabels[member.role]?.label || member.role}
                  </span>
                  {member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      className="text-destructive hover:opacity-80 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {removingId === member.id ? 'Kaldırılıyor...' : 'Kaldır'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Limits */}
      <div className="mt-6 bg-primary-light rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-primary">Plan Limitleri</p>
          <p className="text-xs text-primary/80 mt-0.5">Ücretsiz plan en fazla 2 temsilci destekler. Daha fazla temsilci için planınızı yükseltin.</p>
        </div>
      </div>
    </div>
  )
}