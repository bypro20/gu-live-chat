'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

// Module-level singleton: one socket shared across all hook instances
let socket: Socket | null = null
let connectionCount = 0
let connectingPromise: Promise<Socket> | null = null

function getOrCreateSocket(): Socket {
  if (socket?.connected) return socket
  if (socket) return socket

  const socketUrl = typeof window !== 'undefined' ? window.location.origin : ''

  socket = io(socketUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
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

export function getSocket(): Socket | null {
  return socket
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    connectionCount++
    const s = getOrCreateSocket()
    socketRef.current = s

    // Ensure connected
    if (!s.connected) {
      s.connect()
    }

    return () => {
      connectionCount--
      // Only disconnect when no more components need it and after a delay
      // (avoid disconnecting during navigation)
      if (connectionCount <= 0) {
        setTimeout(() => {
          if (connectionCount <= 0 && socket) {
            socket.disconnect()
            socket = null
            connectingPromise = null
          }
        }, 3000)
      }
    }
  }, [])

  const emit = useCallback((event: string, ...args: any[]) => {
    const s = socketRef.current || socket
    if (s) {
      if (!s.connected) {
        s.connect()
      }
      s.emit(event, ...args)
    }
  }, [])

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const s = socketRef.current || socket
    if (s) {
      s.on(event, handler)
      return () => {
        s.off(event, handler)
      }
    }
    return () => {}
  }, [])

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    const s = socketRef.current || socket
    if (s) {
      s.off(event, handler)
    }
  }, [])

  return { socket: socketRef.current, emit, on, off }
}