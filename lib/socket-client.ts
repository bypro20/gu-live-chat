'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let retainCount = 0
let socketConnected = false

/**
 * Dedicated Socket.io server URL (Railway / local custom server).
 * In production on Vercel, set NEXT_PUBLIC_SOCKET_URL to your socket host.
 * When unset, the app uses REST polling only — no doomed same-origin socket attempts.
 */
function getSocketUrl(): string | undefined {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
  if (envUrl) return envUrl

  // Local dev with `npm run dev` (tsx server.ts) — socket on same origin
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return window.location.origin
  }

  return undefined
}

export function isSocketEnabled(): boolean {
  return !!getSocketUrl()
}

/** True when Socket.io is connected. Falls back to REST polling otherwise. */
export function isSocketConnected(): boolean {
  return socketConnected
}

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): Socket | null {
  if (socket) return socket

  const socketUrl = getSocketUrl()
  if (!socketUrl) return null

  socket = io(socketUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    upgrade: true,
    rememberUpgrade: true,
  })

  socket.on('connect', () => {
    socketConnected = true
    console.log('[Gu Socket] Connected:', socket?.id, `(server: ${socketUrl})`)
  })

  socket.on('disconnect', (reason) => {
    socketConnected = false
    console.log('[Gu Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    socketConnected = false
    console.error('[Gu Socket] Connection error:', err.message)
  })

  return socket
}

export function retainSocket(): Socket | null {
  retainCount++
  return connectSocket()
}

export function releaseSocket() {
  retainCount = Math.max(0, retainCount - 1)
  if (retainCount === 0 && socket) {
    socket.disconnect()
    socket = null
    socketConnected = false
  }
}

export function disconnectSocket() {
  retainCount = 0
  if (socket) {
    socket.disconnect()
    socket = null
    socketConnected = false
  }
}
