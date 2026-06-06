'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let retainCount = 0
let socketConnected = false

/** True when Socket.io is connected. Vercel serverless has no socket — falls back to REST polling. */
export function isSocketConnected(): boolean {
  return socketConnected
}

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): Socket {
  // Return existing socket regardless of connection state —
  // creating a new one would orphan the old socket and lose its event handlers.
  if (socket) return socket

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || undefined

  socket = io(socketUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    upgrade: true,
    rememberUpgrade: true,
  })

  socket.on('connect', () => {
    socketConnected = true
    console.log('[Gu Socket] Connected:', socket?.id, socketUrl ? `(server: ${socketUrl})` : '(same-origin)')
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

export function retainSocket(): Socket {
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
