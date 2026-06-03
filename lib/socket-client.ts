'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): Socket {
  // Return existing socket regardless of connection state —
  // creating a new one would orphan the old socket and lose its event handlers.
  if (socket) return socket

  socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    upgrade: true,
    rememberUpgrade: true,
  })

  socket.on('connect', () => {
    console.log('[Gu Socket] Connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Gu Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('[Gu Socket] Connection error:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}