'use client'

import { useEffect, useRef, useCallback } from 'react'
import { connectSocket, getSocket, releaseSocket, retainSocket } from '@/lib/socket-client'
import type { Socket } from 'socket.io-client'

export { getSocket } from '@/lib/socket-client'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const s = retainSocket()
    socketRef.current = s

    return () => {
      releaseSocket()
    }
  }, [])

  const emit = useCallback((event: string, ...args: unknown[]) => {
    const s = socketRef.current || getSocket() || connectSocket()
    if (!s) return
    if (!s.connected) s.connect()
    s.emit(event, ...args)
  }, [])

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    const s = socketRef.current || getSocket() || connectSocket()
    if (!s) return () => {}
    s.on(event, handler)
    return () => {
      s.off(event, handler)
    }
  }, [])

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    const s = socketRef.current || getSocket()
    if (s) s.off(event, handler)
  }, [])

  return { socket: socketRef.current, emit, on, off }
}
