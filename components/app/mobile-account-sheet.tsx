'use client'

import Link from 'next/link'
import type { Session } from 'next-auth'

type MobileAccountSheetProps = {
  open: boolean
  onClose: () => void
  session: Session | null
  showSwitchAccount?: boolean
  onSwitchAccount?: () => void
  onSignOut: () => void
  switchAccountLabel: string
  signOutLabel: string
  cancelLabel: string
  settingsLabel?: string
  loginLabel?: string
}

export function MobileAccountSheet({
  open,
  onClose,
  session,
  showSwitchAccount,
  onSwitchAccount,
  onSignOut,
  switchAccountLabel,
  signOutLabel,
  cancelLabel,
  settingsLabel = 'Hesap ayarları',
  loginLabel = 'Giriş yap',
}: MobileAccountSheetProps) {
  if (!open) return null

  const userInitial =
    session?.user?.name?.charAt(0)?.toUpperCase() ||
    session?.user?.email?.charAt(0)?.toUpperCase() ||
    '?'

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[120] bg-black/50 lg:hidden"
        aria-label={cancelLabel}
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[121] lg:hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-200">
        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                  {session?.user?.name || 'Hesap'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-2 space-y-1">
            {session ? (
              <>
                <Link
                  href="/settings"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold bg-muted text-foreground active:scale-[0.99] transition-transform"
                >
                  {settingsLabel}
                </Link>
                {showSwitchAccount && onSwitchAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onSwitchAccount()
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-muted text-foreground"
                  >
                    {switchAccountLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onSignOut()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-500 active:scale-[0.99] transition-transform"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {signOutLabel}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-primary"
              >
                {loginLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-sm font-medium text-muted-foreground"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
