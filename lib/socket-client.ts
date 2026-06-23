'use client'

import { io, Socket } from 'socket.io-client'
import { SITE_DOMAIN } from '@/lib/site-config'

let socket: Socket | null = null
let retainCount = 0
let socketConnected = false

/** Vercel rewrite ile socket aynı origin üzerinden proxy edilir */
const SOCKET_PROXY_HOSTS = new Set([
  SITE_DOMAIN,
  `www.${SITE_DOMAIN}`,
  'guchat.org',
  'www.guchat.org',
  'localhost',
  '127.0.0.1',
])

function useSocketProxy(): boolean {
  if (typeof window === 'undefined') return false
  return SOCKET_PROXY_HOSTS.has(window.location.hostname)
}

/** Vercel preview hostları doğrudan Railway'e bağlanır (rewrite yok) */
function isUsableDirectSocketUrl(url: string): boolean {
  const normalized = url.replace(/\/$/, '').toLowerCase()
  if (!normalized) return false
  if (normalized.includes('.vercel.app')) return false
  return true
}

/**
 * Socket.io URL — gulivechat.com'da same-origin proxy, aksi halde Railway.
 */
function getSocketUrl(): string | undefined {
  if (typeof window !== 'undefined' && useSocketProxy()) {
    return window.location.origin
  }

  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
  if (envUrl && isUsableDirectSocketUrl(envUrl)) return envUrl

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

  const proxied = typeof window !== 'undefined' && useSocketProxy()

  socket = io(socketUrl, {
    path: '/socket.io',
    // Vercel rewrite websocket upgrade desteklemez — polling yeterli
    transports: proxied ? ['polling'] : ['websocket', 'polling'],
    autoConnect: true,
    upgrade: !proxied,
    rememberUpgrade: !proxied,
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
