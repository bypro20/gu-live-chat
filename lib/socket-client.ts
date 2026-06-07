'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let retainCount = 0
let socketConnected = false

/** Vercel / ana site URL'si socket sunucusu değildir — yanıltıcı env'yi yoksay. */
function isUsableSocketUrl(url: string): boolean {
  const normalized = url.replace(/\/$/, '').toLowerCase()
  if (!normalized) return false
  // Vercel preview/production app hostları Socket.io çalıştıramaz
  if (normalized.includes('.vercel.app')) return false
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '').toLowerCase()
  if (appUrl && normalized === appUrl) return false
  if (appUrl && normalized === appUrl.replace('://www.', '://')) return false
  return true
}

/**
 * Dedicated Socket.io server URL (Railway / local custom server).
 * Geçersiz veya eksik URL'de undefined döner → REST polling devreye girer.
 */
function getSocketUrl(): string | undefined {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
  if (envUrl && isUsableSocketUrl(envUrl)) return envUrl

  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return window.location.origin
  }

  return undefined
}

export function isSocketEnabled(): boolean {
  return !!getSocketUrl()
}

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
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 8000,
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
    console.warn('[Gu Socket] Connection error:', err.message)
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
