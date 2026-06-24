'use client'

import { unlockInboxAudio } from '@/lib/inbox-sound'

export type PersistentAlertReason = 'message' | 'visitor' | 'conversation'

export type PersistentInboxAlert = {
  id: string
  label: string
  reason: PersistentAlertReason
  preview?: string
  conversationId?: string
  startedAt: number
}

let intervalId: ReturnType<typeof setInterval> | null = null
const active = new Map<string, PersistentInboxAlert>()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

function playLoudAlarmBurst(): void {
  if (typeof window === 'undefined') return
  try {
    unlockInboxAudio()
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    void ctx.resume()

    const schedule = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
      gain.gain.setValueAtTime(volume, start + duration * 0.65)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + duration + 0.05)
    }

    const t = ctx.currentTime
    schedule(880, t, 0.22, 0.92)
    schedule(1174.66, t + 0.24, 0.22, 0.88)
    schedule(880, t + 0.52, 0.22, 0.92)
    schedule(987.77, t + 0.76, 0.28, 0.85)

    window.setTimeout(() => void ctx.close().catch(() => {}), 1400)
  } catch {
    // ignore
  }
}

function ensureLoop() {
  if (intervalId != null) return
  playLoudAlarmBurst()
  intervalId = setInterval(playLoudAlarmBurst, 2000)
}

function stopLoopIfEmpty() {
  if (active.size > 0 || intervalId == null) return
  clearInterval(intervalId)
  intervalId = null
}

export function getPersistentInboxAlerts(): PersistentInboxAlert[] {
  return [...active.values()].sort((a, b) => b.startedAt - a.startedAt)
}

export function subscribePersistentInboxAlerts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function startPersistentInboxAlert(alert: Omit<PersistentInboxAlert, 'startedAt'>): void {
  if (typeof window === 'undefined') return
  unlockInboxAudio()
  active.set(alert.id, { ...alert, startedAt: Date.now() })
  ensureLoop()
  notify()
}

export function stopPersistentInboxAlert(id?: string): void {
  if (id) {
    active.delete(id)
  } else {
    active.clear()
  }
  stopLoopIfEmpty()
  notify()
}

export function stopPersistentInboxAlertsForConversation(conversationId: string): void {
  for (const [id, alert] of active) {
    if (id === conversationId || alert.conversationId === conversationId) {
      active.delete(id)
    }
  }
  stopLoopIfEmpty()
  notify()
}

export function hasPersistentInboxAlert(id: string): boolean {
  return active.has(id)
}
