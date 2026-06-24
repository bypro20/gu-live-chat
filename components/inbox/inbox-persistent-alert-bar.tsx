'use client'

import { AlertTriangle, MessageSquare, UserRound, X } from 'lucide-react'
import {
  getPersistentInboxAlerts,
  stopPersistentInboxAlert,
  type PersistentInboxAlert,
} from '@/lib/inbox-persistent-alert'

function reasonIcon(reason: PersistentInboxAlert['reason']) {
  if (reason === 'visitor') return UserRound
  if (reason === 'conversation') return MessageSquare
  return AlertTriangle
}

export function InboxPersistentAlertBar({
  alerts,
  onOpen,
}: {
  alerts: PersistentInboxAlert[]
  onOpen: (alert: PersistentInboxAlert) => void
}) {
  if (alerts.length === 0) return null

  return (
    <div className="inbox-alert-bar shrink-0 border-b border-red-500/40 bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-[0_8px_24px_rgba(239,68,68,0.35)] animate-pulse">
      {alerts.map((alert) => {
        const Icon = reasonIcon(alert.reason)
        const targetId = alert.conversationId || alert.id
        return (
          <div
            key={alert.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/10 last:border-b-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 ring-2 ring-white/20">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tracking-tight">{alert.label}</p>
              {alert.preview && (
                <p className="text-xs text-white/85 truncate mt-0.5">{alert.preview}</p>
              )}
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/70 mt-1">
                Sohbeti açana kadar uyarı devam eder
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpen(alert)}
              className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-700 hover:bg-red-50 transition-colors"
            >
              Sohbeti aç
            </button>
            <button
              type="button"
              onClick={() => stopPersistentInboxAlert(targetId.startsWith('visitor:') ? alert.id : targetId)}
              className="shrink-0 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              title="Sustur"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function usePersistentAlertList(): PersistentInboxAlert[] {
  // Hook lives in admin panel via useState + subscribe — exported type helper only
  return getPersistentInboxAlerts()
}
