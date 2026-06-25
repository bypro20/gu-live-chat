'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { uploadInboxFile } from '@/lib/inbox-upload'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'

type Profile = {
  id: string
  name: string | null
  email: string
  image: string | null
}

export function AgentProfileSection() {
  const { data: session, update: updateSession } = useSession()
  const { general: t, common } = useSettingsI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile', { credentials: 'include' })
      if (!res.ok) throw new Error(common.connectionError)
      const data = (await res.json()) as Profile
      setProfile(data)
      setDisplayName(data.name || '')
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : common.connectionError,
      })
    } finally {
      setLoading(false)
    }
  }, [common.connectionError])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const saveProfile = async (patch: { name?: string; image?: string | null }) => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || common.saveFailed)

      setProfile(data as Profile)
      if (patch.name !== undefined) setDisplayName(data.name || '')
      await updateSession({
        user: {
          name: data.name,
          image: data.image,
        },
      })
      setMessage({ type: 'success', text: t.profileSavedSuccess })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : common.saveFailed,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: t.profileNameRequired })
      return
    }
    await saveProfile({ name: displayName.trim() })
  }

  const handlePhotoSelect = async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t.profilePhotoTypeError })
      return
    }

    setUploading(true)
    setMessage(null)
    try {
      const uploaded = await uploadInboxFile(file)
      await saveProfile({ image: uploaded.url })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t.profilePhotoUploadFailed,
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    await saveProfile({ image: null })
  }

  const avatarUrl = profile?.image || session?.user?.image || null
  const initial =
    displayName.trim().charAt(0)?.toUpperCase() ||
    profile?.email?.charAt(0)?.toUpperCase() ||
    session?.user?.email?.charAt(0)?.toUpperCase() ||
    '?'

  return (
    <div className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">{t.profileSectionTitle}</h2>
      <p className="text-sm text-muted-foreground mb-5">{t.profileSectionSubtitle}</p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-light flex items-center justify-center text-primary text-2xl font-bold">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName || t.profilePhotoAlt} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              {(uploading || saving) && (
                <div className="absolute inset-0 rounded-2xl bg-background/70 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => void handlePhotoSelect(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="btn-primary min-h-[44px] px-4"
              >
                {uploading ? common.saving : t.profileUploadPhoto}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => void handleRemovePhoto()}
                  disabled={uploading || saving}
                  className="min-h-[44px] px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border-strong transition disabled:opacity-50"
                >
                  {t.profileRemovePhoto}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t.profileDisplayName}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="native-input"
              placeholder={t.profileDisplayNamePlaceholder}
            />
            <p className="text-xs text-muted-foreground mt-1.5">{t.profileDisplayNameHint}</p>
          </div>

          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-success-light text-success'
                  : 'bg-destructive-light text-destructive'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSaveName()}
            disabled={saving || uploading}
            className="btn-primary w-full sm:w-auto justify-center min-h-[48px] px-6"
          >
            {saving ? common.saving : common.save}
          </button>
        </div>
      )}
    </div>
  )
}
