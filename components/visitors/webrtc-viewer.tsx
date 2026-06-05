'use client'

import { useEffect, useRef } from 'react'
import { WebRTCPeer, type WebRTCConnectionState } from '@/lib/webrtc'
import { useSocket } from '@/lib/hooks/use-socket'

interface WebRTCViewerProps {
  visitorId: string
  websiteId: string
  agentId: string
  onStreamReady: (stream: MediaStream) => void
  onDenied: () => void
  onStopped: () => void
  onStateChange: (state: WebRTCConnectionState) => void
}

export function WebRTCViewer({
  visitorId,
  websiteId,
  agentId,
  onStreamReady,
  onDenied,
  onStopped,
  onStateChange,
}: WebRTCViewerProps) {
  const peerRef = useRef<WebRTCPeer | null>(null)
  const { on, emit } = useSocket()

  // Keep the latest callbacks in a ref so the peer-creation effect below does
  // NOT depend on them. The parent (visitors page) re-renders on every cursor /
  // screenshot update and passes fresh inline callbacks each time. If those were
  // effect dependencies, the effect would tear down and recreate the peer
  // connection ~12×/sec — stopping the remote tracks and freezing the video.
  const cbRef = useRef({ onStreamReady, onDenied, onStopped, onStateChange })
  useEffect(() => {
    cbRef.current = { onStreamReady, onDenied, onStopped, onStateChange }
  })

  // Create the peer connection ONCE per visitor/website/agent. `emit` is stable
  // (useCallback in useSocket), so this effect only re-runs when the target
  // visitor actually changes.
  useEffect(() => {
    const peer = new WebRTCPeer()
    peerRef.current = peer

    peer.onRemoteStream((stream) => {
      const track = stream.getVideoTracks()[0]
      console.log('[WebRTCViewer] Remote stream received', {
        streamId: stream.id,
        trackReadyState: track?.readyState,
        trackMuted: track?.muted,
      })
      cbRef.current.onStreamReady(stream)
      cbRef.current.onStateChange('connected')
    })

    peer.onSignal((signal) => {
      emit('webrtc:signal', { visitorId, websiteId, agentId, signal })
    })

    peer.onStateChange((state) => {
      console.log('[WebRTCViewer] Connection state:', state)
      cbRef.current.onStateChange(state)
      // Only a genuinely terminal state tears down the view. 'disconnected' is
      // transient (network blip during ICE) and almost always recovers on its
      // own — nulling the stream there is what froze the screen previously.
      if (state === 'failed' || state === 'closed') {
        cbRef.current.onStopped()
      }
    })

    return () => {
      peer.close()
      peerRef.current = null
    }
  }, [visitorId, websiteId, agentId, emit])

  // Socket.io signal listeners — also created once per visitor.
  useEffect(() => {
    const handleSignal = (data: any) => {
      if (data.visitorId !== visitorId) return
      const peer = peerRef.current
      if (!peer) return

      if (data.signal.type === 'offer') {
        console.log('[WebRTCViewer] Received offer from visitor')
        peer.handleOffer(data.signal)
      } else if (data.signal.type === 'ice-candidate') {
        peer.handleIceCandidate(data.signal.candidate)
      }
    }

    const handleDenied = (data: any) => {
      if (data.visitorId === visitorId) {
        console.log('[WebRTCViewer] Visitor denied screen sharing')
        cbRef.current.onDenied()
      }
    }

    const handleStopped = (data: any) => {
      if (data.visitorId === visitorId) {
        console.log('[WebRTCViewer] WebRTC session stopped by visitor')
        cbRef.current.onStopped()
      }
    }

    const unsubSignal = on('webrtc:signal', handleSignal)
    const unsubDenied = on('webrtc:denied', handleDenied)
    const unsubStopped = on('webrtc:stopped', handleStopped)

    return () => {
      unsubSignal()
      unsubDenied()
      unsubStopped()
    }
  }, [visitorId, on])

  // This component renders nothing — it only manages the WebRTC connection and
  // hands the stream up to the parent / OverlayPreview.
  return null
}
