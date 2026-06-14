'use client'

import { useCallback, useEffect, useRef } from 'react'

/** Mesaj alanında scrollIntoView kullanmadan alta sabitle — sayfa zıplamasını önler. */
export function useInboxMessageScroll(
  messagesLength: number,
  conversationId: string | null,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLenRef = useRef(0)
  const prevConvRef = useRef<string | null>(null)
  const stickToBottomRef = useRef(true)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 96
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = containerRef.current
    if (!el) return
    if (behavior === 'auto') {
      el.scrollTop = el.scrollHeight
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior })
    }
  }, [])

  useEffect(() => {
    const convChanged = conversationId !== prevConvRef.current
    if (convChanged) {
      prevConvRef.current = conversationId
      prevLenRef.current = messagesLength
      stickToBottomRef.current = true
      requestAnimationFrame(() => scrollToBottom('auto'))
      return
    }

    const grew = messagesLength > prevLenRef.current
    prevLenRef.current = messagesLength

    if (grew || stickToBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom('auto'))
    }
  }, [messagesLength, conversationId, scrollToBottom])

  return { containerRef, handleScroll, scrollToBottom }
}
