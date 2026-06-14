let audioCtx: AudioContext | null = null

/** Tarayıcı ses kilidini aç (ilk tıklamada çağrılmalı). */
export function unlockInboxAudio(): void {
  if (typeof window === 'undefined') return
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new Ctx()
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume()
    }
  } catch {
    // ignore
  }
}

/** Telefon bildirimi tarzı kısa çift ton. */
export function playInboxNotificationSound(): void {
  if (typeof window === 'undefined') return
  try {
    unlockInboxAudio()
    if (!audioCtx) return

    const playTone = (freq: number, start: number, duration: number, volume = 0.2) => {
      const osc = audioCtx!.createOscillator()
      const gain = audioCtx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      osc.connect(gain)
      gain.connect(audioCtx!.destination)
      osc.start(start)
      osc.stop(start + duration + 0.04)
    }

    const t = audioCtx.currentTime
    playTone(880, t, 0.09, 0.22)        // A5 — ilk ping
    playTone(1174.66, t + 0.1, 0.11, 0.18) // D6 — ikinci ping
  } catch {
    // Sessizce geç
  }
}

/** Ziyaretçi girişi — tek yükselen ton. */
export function playVisitorNotificationSound(): void {
  if (typeof window === 'undefined') return
  try {
    unlockInboxAudio()
    if (!audioCtx) return

    const playTone = (freq: number, start: number, duration: number, volume = 0.18) => {
      const osc = audioCtx!.createOscillator()
      const gain = audioCtx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      osc.connect(gain)
      gain.connect(audioCtx!.destination)
      osc.start(start)
      osc.stop(start + duration + 0.04)
    }

    const t = audioCtx.currentTime
    playTone(659.25, t, 0.08, 0.2)
    playTone(783.99, t + 0.09, 0.12, 0.16)
  } catch {
    // ignore
  }
}

export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showDesktopNotification(title: string, body: string, tag = 'gu-inbox'): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return
  try {
    new Notification(title, { body, icon: '/app-icon.png', tag })
  } catch {
    // ignore
  }
}

export function showVisitorDesktopNotification(title: string, body: string): void {
  showDesktopNotification(title, body, 'gu-visitor')
}
