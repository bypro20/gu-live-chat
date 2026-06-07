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

/** Crisp tarzı kısa çift ton bildirim sesi. */
export function playInboxNotificationSound(): void {
  if (typeof window === 'undefined') return
  try {
    unlockInboxAudio()
    if (!audioCtx) return

    const playTone = (freq: number, start: number, duration: number, volume = 0.15) => {
      const osc = audioCtx!.createOscillator()
      const gain = audioCtx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      osc.connect(gain)
      gain.connect(audioCtx!.destination)
      osc.start(start)
      osc.stop(start + duration + 0.05)
    }

    const t = audioCtx.currentTime
    playTone(659.25, t, 0.1, 0.18)       // E5
    playTone(783.99, t + 0.11, 0.14, 0.16) // G5
    playTone(987.77, t + 0.24, 0.2, 0.12)  // B5
  } catch {
    // Sessizce geç
  }
}

export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showDesktopNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return
  try {
    new Notification(title, { body, icon: '/favicon.ico', tag: 'gu-inbox' })
  } catch {
    // ignore
  }
}
