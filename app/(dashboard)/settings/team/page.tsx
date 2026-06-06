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
    OWNER: { label: 'Sahip', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    ADMIN: { label: 'Yönetici', color: 'bg-[#1972F5]/10 text-[#1E40AF] dark:bg-blue-900/30 dark:text-blue-400' },
    MEMBER: { label: 'Temsilci', color: 'bg-[#EFF6FF] text-[#1E40AF] dark:bg-gray-700 dark:text-gray-300' },
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
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Takım Yönetimi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Temsilcileri yönetin ve yeni üyeler davet edin</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="px-4 py-2.5 bg-[#1972F5] hover:bg-[#1565DB] text-white font-medium rounded-xl transition shadow-md shadow-[#1972F5]/30"
        >
          + Üye Davet Et
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Invite Form */}
      {showInvite && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Üye Davet Et</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="E-posta adresi"
              className="flex-1 px-4 py-3 border border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1972F5] focus:border-transparent outline-none transition"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-4 py-3 border border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1972F5] focus:border-transparent outline-none transition"
            >
              <option value="MEMBER">Temsilci</option>
              <option value="ADMIN">Yönetici</option>
            </select>
            <button
              onClick={handleInvite}
              className="px-6 py-3 bg-[#1972F5] hover:bg-[#1565DB] text-white font-medium rounded-xl transition shadow-md shadow-[#1972F5]/30"
            >
              Davet Gönder
            </button>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#1972F5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Henüz takım üyesi yok</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Yukarıdaki butonu kullanarak üye davet edin</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {(members as unknown as TeamMember[]).map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1972F5]/10 rounded-full flex items-center justify-center text-[#1972F5] font-medium text-sm">
                    {member.user?.name?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{member.user?.name || 'İsimsiz'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleLabels[member.role]?.color || roleLabels.MEMBER.color}`}>
                    {roleLabels[member.role]?.label || member.role}
                  </span>
                  {member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      className="text-red-500 hover:text-red-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="mt-6 bg-[#1972F5]/10 dark:bg-blue-900/20 rounded-2xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-[#1972F5] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-[#1E40AF] dark:text-blue-400">Plan Limitleri</p>
          <p className="text-xs text-[#1E40AF]/80 dark:text-blue-400/70 mt-0.5">Ücretsiz plan en fazla 2 temsilci destekler. Daha fazla temsilci için planınızı yükseltin.</p>
        </div>
      </div>
    </div>
  )
}