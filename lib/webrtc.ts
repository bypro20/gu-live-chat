// WebRTC Peer Connection utility for admin-side screen sharing
// Handles RTCPeerConnection creation, offer/answer management, and ICE candidate relay

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate'
  sdp?: string
  candidate?: RTCIceCandidateInit
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export type WebRTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed' | 'idle' | 'denied'

export class WebRTCPeer {
  private peerConnection: RTCPeerConnection | null = null
  private remoteStream: MediaStream | null = null
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null
  private onSignalCallback: ((signal: WebRTCSignal) => void) | null = null
  private onConnectionStateChange: ((state: WebRTCConnectionState) => void) | null = null
  private iceCandidatesQueue: RTCIceCandidateInit[] = []
  private isRemoteDescriptionSet = false

  constructor() {
    this.createPeerConnection()
  }

  private createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.streams[0]?.id)
      this.remoteStream = event.streams[0]
      this.onRemoteStreamCallback?.(event.streams[0])
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onSignalCallback?.({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        })
      }
    }

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState as WebRTCConnectionState | undefined
      console.log('[WebRTC] ICE connection state:', state)
      if (state) {
        this.onConnectionStateChange?.(state)
      }
    }

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState
      console.log('[WebRTC] Connection state:', state, '| ICE:', this.peerConnection?.iceConnectionState)
      // Forward the raw connection state. The consumer decides what is terminal —
      // 'disconnected' is transient and usually recovers, so it must NOT tear down.
      if (state) {
        this.onConnectionStateChange?.(state as WebRTCConnectionState)
      }
    }

    // Process queued ICE candidates after remote description is set
    this.peerConnection.onnegotiationneeded = () => {
      console.log('[WebRTC] Negotiation needed')
    }
  }

  // Handle an incoming offer from the visitor (screen sharer)
  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      this.isRemoteDescriptionSet = true

      // Process queued ICE candidates
      while (this.iceCandidatesQueue.length > 0) {
        const candidate = this.iceCandidatesQueue.shift()!
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.error('[WebRTC] Error adding queued ICE candidate:', err)
        }
      }

      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      this.onSignalCallback?.({
        type: 'answer',
        sdp: answer.sdp!,
      })

      console.log('[WebRTC] Answer created and sent')
    } catch (err) {
      console.error('[WebRTC] Error handling offer:', err)
    }
  }

  // Handle an incoming ICE candidate
  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return

    if (!this.isRemoteDescriptionSet) {
      // Queue the candidate until remote description is set
      this.iceCandidatesQueue.push(candidate)
      return
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error('[WebRTC] Error adding ICE candidate:', err)
    }
  }

  // Set callback for when a remote stream is received
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback
  }

  // Set callback for when a signal needs to be sent to the remote peer
  onSignal(callback: (signal: WebRTCSignal) => void) {
    this.onSignalCallback = callback
  }

  // Set callback for connection state changes
  onStateChange(callback: (state: WebRTCConnectionState) => void) {
    this.onConnectionStateChange = callback
  }

  // Get the current remote stream
  getStream(): MediaStream | null {
    return this.remoteStream
  }

  // Get the current connection state
  getConnectionState(): WebRTCConnectionState {
    if (!this.peerConnection) return 'closed'
    return (this.peerConnection.iceConnectionState as WebRTCConnectionState) || 'new'
  }

  // Close the peer connection and clean up
  close() {
    console.log('[WebRTC] Closing peer connection')
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop())
      this.remoteStream = null
    }
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    this.onRemoteStreamCallback = null
    this.onSignalCallback = null
    this.onConnectionStateChange = null
    this.iceCandidatesQueue = []
    this.isRemoteDescriptionSet = false
  }
}