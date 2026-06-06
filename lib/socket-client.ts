'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let retainCount = 0
let socketConnected = false

/** Normalised socket server URL, or undefined when none is configured. */
function getSocketUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL
  return url && url.trim() ? url.trim() : undefined
}

/**
 * True when a dedicated Socket.io server is configured (local dev / Railway).
 * On Vercel serverless there is no socket server, so this is false and the app
 * relies on REST polling. We deliberately do NOT attempt a same-origin socket
 * connection there — it would only spam reconnect errors in the console.
 */
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
  // Return existing socket regardless of connection state —
  // creating a new one would orphan the old socket and lose its event handlers.
  if (socket) return socket

  const socketUrl = getSocketUrl()

  // No dedicated socket server configured (e.g. Vercel serverless).
  // Stay silently in polling mode instead of attempting a doomed connection.
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
  }
}

export function disconnectSocket() {
  retainCount = 0
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
