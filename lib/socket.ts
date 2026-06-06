import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import { prisma } from './db'

let io: SocketIOServer

// ─── In-Memory Tracking ──────────────────────────────────────────
interface VisitorSessionInfo {
  visitorId: string
  websiteId: string
  sessionId: string
  socketId: string
  currentPage: string
  currentTitle: string
  cursorX: number
  cursorY: number
  viewportW: number
  viewportH: number
  scrollY: number
  documentH: number
  lastScreenshotUrl: string | null
  lastScreenshotAt: Date | null
  connectedAt: Date
  lastActiveAt: Date
}

const agentOnline = new Map<string, Set<string>>() // websiteId -> Set of userIds
const visitorSessions = new Map<string, VisitorSessionInfo>() // socketId -> session info

export function initSocketServer(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    maxHttpBufferSize: 10e6, // 10MB — large enough for screenshot data URLs
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`)

    // ─── Agent Authentication ──────────────────────────────────
    socket.on('agent:auth', async (data: { userId: string; websiteIds: string[] }) => {
      const { userId } = data
      const requestedWebsiteIds = Array.isArray(data.websiteIds) ? data.websiteIds : []

      // Tenant isolation: never trust the client-supplied website list. Only
      // let this user join the rooms of websites they are actually a member of.
      // `requestedWebsiteIds` are public websiteIds; membership is stored
      // against the internal website id, so we resolve through the relation.
      let websiteIds: string[] = []
      if (userId && requestedWebsiteIds.length > 0) {
        try {
          const memberships = await prisma.teamMember.findMany({
            where: {
              userId,
              website: { websiteId: { in: requestedWebsiteIds } },
            },
            select: { website: { select: { websiteId: true } } },
          })
          websiteIds = memberships.map((m) => m.website.websiteId)
        } catch (err) {
          console.error('[Socket] agent:auth membership check failed:', err)
          return
        }
      }

      if (websiteIds.length === 0) {
        console.warn(`[Socket] agent:auth denied for user ${userId}: no verified website membership`)
        return
      }

      // Store userId on socket for cleanup
      ;(socket as any).userId = userId
      ;(socket as any).websiteIds = websiteIds

      // Join website rooms
      websiteIds.forEach((websiteId) => {
        socket.join(`website:${websiteId}`)

        // Track online agents
        if (!agentOnline.has(websiteId)) {
          agentOnline.set(websiteId, new Set())
        }
        agentOnline.get(websiteId)!.add(userId)
      })

      // Notify other agents about online status
      websiteIds.forEach((websiteId) => {
        io.to(`website:${websiteId}`).emit('agent:member:online', {
          userId,
          websiteId,
          onlineCount: agentOnline.get(websiteId)?.size || 0,
        })

        // Notify visitors that agents are online
        io.to(`website:${websiteId}`).emit('visitor:online', {
          agentsOnline: agentOnline.get(websiteId)?.size || 0,
        })
      })

      console.log(`[Socket] Agent ${userId} authenticated for websites: ${websiteIds.join(', ')}`)
    })

    // ─── Agent requests current live visitors ──────────────────
    socket.on('agent:visitor:list', (data: { websiteId: string }) => {
      const { websiteId } = data
      const visitors = Array.from(visitorSessions.values())
        .filter((v) => v.websiteId === websiteId)
        .map((v) => ({
          visitorId: v.visitorId,
          websiteId: v.websiteId,
          currentPage: v.currentPage,
          currentTitle: v.currentTitle,
          cursorX: v.cursorX,
          cursorY: v.cursorY,
          viewportW: v.viewportW,
          viewportH: v.viewportH,
          scrollY: v.scrollY,
          documentH: v.documentH,
          connectedAt: v.connectedAt.toISOString(),
          lastActiveAt: v.lastActiveAt.toISOString(),
        }))
      socket.emit('agent:visitor:list:response', { websiteId, visitors })
    })

    // ─── Visitor Authentication ────────────────────────────────
    socket.on('visitor:auth', (data: { visitorToken?: string; visitorId?: string; websiteId?: string; conversationId?: string }) => {
      let visitorId = data.visitorId || ''
      let websiteId = data.websiteId || ''
      let sessionId = ''

      // Decode visitorToken if provided (from widget init)
      if (data.visitorToken) {
        try {
          const decoded = JSON.parse(Buffer.from(data.visitorToken, 'base64').toString())
          visitorId = decoded.visitorId || visitorId
          websiteId = decoded.websiteId || websiteId
          sessionId = decoded.sessionId || ''
        } catch { /* ignore invalid token */ }
      }

      if (!websiteId) {
        console.warn(`[Socket] Visitor auth failed: no websiteId`)
        return
      }

      socket.join(`website:${websiteId}`)
      if (data.conversationId) {
        socket.join(`conversation:${data.conversationId}`)
      }

      // Track visitor session
      const sessionInfo: VisitorSessionInfo = {
        visitorId,
        websiteId,
        sessionId,
        socketId: socket.id,
        currentPage: '',
        currentTitle: '',
        cursorX: 0,
        cursorY: 0,
        viewportW: 0,
        viewportH: 0,
        scrollY: 0,
        documentH: 0,
        lastScreenshotUrl: null,
        lastScreenshotAt: null,
        connectedAt: new Date(),
        lastActiveAt: new Date(),
      }
      visitorSessions.set(socket.id, sessionInfo)

      // Send agents online count
      const onlineCount = agentOnline.get(websiteId)?.size || 0
      socket.emit('visitor:online', { agentsOnline: onlineCount })

      // Notify agents about new visitor
      io.to(`website:${websiteId}`).emit('agent:visitor:online', {
        visitorId,
        websiteId,
        currentPage: '',
        currentTitle: '',
        connectedAt: sessionInfo.connectedAt.toISOString(),
      })

      console.log(`[Socket] Visitor ${visitorId.substring(0, 8)}... connected to website ${websiteId} (room: website:${websiteId})`)
    })

    // ─── Join Conversation Rooms ───────────────────────────────
    socket.on('agent:join-conversation', (data: { conversationId: string }) => {
      if (data.conversationId) {
        socket.join(`conversation:${data.conversationId}`)
      }
    })

    socket.on('visitor:join-conversation', (data: { conversationId: string }) => {
      if (data.conversationId) {
        socket.join(`conversation:${data.conversationId}`)
      }
    })

    // ─── Agent Messages ────────────────────────────────────────
    socket.on('agent:message', (data: { conversationId: string; websiteId?: string; content: string; type: string; senderId: string; senderName: string }) => {
      const { conversationId, content, type, senderId, senderName } = data

      // Broadcast to visitor and other agents in the conversation
      io.to(`conversation:${conversationId}`).emit('visitor:message', {
        id: `msg_${Date.now()}`,
        content,
        type,
        senderType: 'AGENT',
        senderId,
        senderName,
        createdAt: new Date().toISOString(),
      })

      // Notify all agents in the website about updated conversation
      if (data.websiteId) {
        io.to(`website:${data.websiteId}`).emit('agent:conversation:updated', {
          conversationId,
          lastMessage: content.substring(0, 100),
        })
      }
    })

    // ─── Visitor Messages ──────────────────────────────────────
    socket.on('visitor:message', (data: { conversationId: string; websiteId?: string; content: string; type: string; visitorId: string }) => {
      const { conversationId, content, type, visitorId } = data

      io.to(`conversation:${conversationId}`).emit('agent:message', {
        id: `msg_${Date.now()}`,
        conversationId,
        content,
        type,
        senderType: 'VISITOR',
        visitorId,
        createdAt: new Date().toISOString(),
      })

      if (data.websiteId) {
        io.to(`website:${data.websiteId}`).emit('agent:conversation:new', {
          conversationId,
          visitorId,
          lastMessage: content.substring(0, 100),
        })
      }
    })

    // ─── Typing Indicators ──────────────────────────────────────
    socket.on('agent:typing', (data: { conversationId: string; agentName: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('visitor:typing', data)
    })

    socket.on('agent:typing:stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('visitor:typing:stop', data)
    })

    const typingThrottle = new Map<string, NodeJS.Timeout>()

    socket.on('visitor:typing', (data: { conversationId: string; visitorId: string; content?: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('agent:typing', data)

      const key = `${data.conversationId}:${data.visitorId}`
      if (data.content && data.content.trim()) {
        if (!typingThrottle.has(key)) {
          socket.to(`conversation:${data.conversationId}`).emit('visitor:typing-preview', {
            conversationId: data.conversationId,
            visitorId: data.visitorId,
            content: data.content,
          })
          typingThrottle.set(key, setTimeout(() => typingThrottle.delete(key), 300))
        }
      }
    })

    socket.on('visitor:typing:stop', (data: { conversationId: string; visitorId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('agent:typing:stop', data)

      const key = `${data.conversationId}:${data.visitorId}`
      const timer = typingThrottle.get(key)
      if (timer) {
        clearTimeout(timer)
        typingThrottle.delete(key)
      }

      socket.to(`conversation:${data.conversationId}`).emit('visitor:typing-preview:clear', {
        conversationId: data.conversationId,
        visitorId: data.visitorId,
      })
    })

    // ─── Read Receipts ─────────────────────────────────────────
    socket.on('agent:read', (data: { conversationId: string; messageIds: string[]; agentId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('visitor:read', data)
    })

    socket.on('visitor:read', (data: { conversationId: string; messageIds: string[]; visitorId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('agent:read', data)
    })

    // ─── Visitor Page Views ─────────────────────────────────────
    socket.on('visitor:pageview', async (data: { visitorId: string; websiteId: string; url: string; title: string; referrer?: string }) => {
      // Update in-memory session
      const session = visitorSessions.get(socket.id)
      if (session) {
        session.currentPage = data.url
        session.currentTitle = data.title || ''
        session.lastActiveAt = new Date()
      }

      // Persist to database
      if (session?.sessionId) {
        try {
          await prisma.visitorSession.update({
            where: { sessionId: session.sessionId },
            data: {
              currentPage: data.url,
              currentTitle: data.title || null,
              lastActiveAt: new Date(),
            },
          })
          await prisma.pageView.create({
            data: {
              sessionId: session.sessionId,
              url: data.url,
              title: data.title || null,
              viewedAt: new Date(),
            },
          })
        } catch {
          // Session may not exist in DB if visitor connected before init completed
        }
      }

      // Broadcast to agents in the website room
      io.to(`website:${data.websiteId}`).emit('agent:visitor:activity', {
        visitorId: data.visitorId,
        websiteId: data.websiteId,
        eventType: 'pageview',
        url: data.url,
        title: data.title,
        referrer: data.referrer,
        timestamp: new Date().toISOString(),
      })
    })

    // ─── Visitor Activity (typing, clicks, form fills, cursor) ────────
    socket.on('visitor:activity', (data: {
      visitorId: string
      websiteId: string
      eventType: 'typing' | 'click' | 'scroll' | 'input' | 'mousemove' | 'focus'
      selector?: string
      text?: string
      fieldName?: string
      fieldType?: string
      url?: string
      x?: number
      y?: number
      viewportW?: number
      viewportH?: number
      scrollY?: number
      scrollPercentage?: number
      documentH?: number
      timestamp?: string
    }) => {
      // Update last active time and cursor position in memory
      const session = visitorSessions.get(socket.id)
      if (!session) {
        return
      }
      session.lastActiveAt = new Date()

      // Update cursor position for mousemove events
      if (data.eventType === 'mousemove') {
        session.cursorX = data.x || session.cursorX
        session.cursorY = data.y || session.cursorY
        session.viewportW = data.viewportW || session.viewportW
        session.viewportH = data.viewportH || session.viewportH
      }

      // Update scroll position
      if (data.eventType === 'scroll') {
        session.scrollY = data.scrollY || session.scrollY
        session.documentH = data.documentH || session.documentH
        if (data.viewportH) session.viewportH = data.viewportH
      }

      // Forward to agents — use dedicated cursor channel for mousemove (high frequency)
      if (data.eventType === 'mousemove') {
        io.to(`website:${data.websiteId}`).emit('agent:visitor:cursor', {
          visitorId: data.visitorId,
          websiteId: data.websiteId,
          x: data.x,
          y: data.y,
          viewportW: data.viewportW,
          viewportH: data.viewportH,
          timestamp: data.timestamp || new Date().toISOString(),
        })
      } else {
        // All other events use the general activity channel
        io.to(`website:${data.websiteId}`).emit('agent:visitor:activity', {
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        })
      }
    })

    // ─── Visitor Screenshot (Screen Monitoring) ────────────────────
    let screenshotCounter = 0
    socket.on('visitor:screenshot', (data: {
      visitorId: string
      websiteId: string
      screenshot: string
      viewportW?: number
      viewportH?: number
      scrollY?: number
      documentH?: number
      privacyMode?: boolean
      timestamp?: string
    }) => {
      const session = visitorSessions.get(socket.id)
      if (!session) {
        console.warn('[Socket] Screenshot from unknown socket, ignoring')
        return
      }

      screenshotCounter++
      // Log every 10th screenshot to avoid console spam
      if (screenshotCounter % 10 === 1) {
        console.log(`[Socket] Screenshot #${screenshotCounter} from visitor ${data.visitorId?.substring(0, 8)}..., size: ${Math.round((data.screenshot?.length || 0) / 1024)}KB`)
      }

      // Update session data
      session.lastScreenshotUrl = data.screenshot
      session.lastScreenshotAt = new Date()
      session.lastActiveAt = new Date()
      if (data.viewportW) session.viewportW = data.viewportW
      if (data.viewportH) session.viewportH = data.viewportH
      if (data.scrollY) session.scrollY = data.scrollY
      if (data.documentH) session.documentH = data.documentH

      // Broadcast screenshot to all agents watching this website
      io.to(`website:${data.websiteId}`).emit('agent:visitor:screenshot', {
        visitorId: data.visitorId,
        websiteId: data.websiteId,
        screenshot: data.screenshot,
        viewportW: data.viewportW,
        viewportH: data.viewportH,
        scrollY: data.scrollY,
        documentH: data.documentH,
        privacyMode: data.privacyMode || false,
        timestamp: data.timestamp || new Date().toISOString(),
      })
    })

    // ─── Agent requests screen capture start/stop ──────────────────
    socket.on('agent:screen:start', (data: { visitorId: string; websiteId: string }) => {
      // Forward to the specific visitor to start sending screenshots
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:screen:start')
        console.log(`[Socket] Screen capture started for visitor ${data.visitorId?.substring(0, 8)}...`)
      } else {
        console.log(`[Socket] No visitor socket found for screen capture: ${data.visitorId?.substring(0, 8)}... website ${data.websiteId?.substring(0, 8)}`)
      }
    })

    socket.on('agent:screen:stop', (data: { visitorId: string; websiteId: string }) => {
      // Forward to the specific visitor to stop sending screenshots
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:screen:stop')
        console.log(`[Socket] Screen capture stopped for visitor ${data.visitorId?.substring(0, 8)}...`)
      }
    })

    // ─── Agent sends remote click to visitor (intervention) ────────
    socket.on('agent:remote-cursor-move', (data: { visitorId: string; websiteId: string; x: number; y: number }) => {
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:remote-cursor-move', { x: data.x, y: data.y })
      }
    })

    socket.on('agent:visitor:click', (data: { visitorId: string; websiteId: string; x: number; y: number }) => {
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:remote-click', { x: data.x, y: data.y })
      }
    })

    // ─── Agent sends mouse move to visitor (intervention mode) ──
    socket.on('agent:visitor:mousemove', (data: { visitorId: string; websiteId: string; x: number; y: number }) => {
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:remote-mousemove', { x: data.x, y: data.y })
      }
    })

    // ─── Agent sends scroll to visitor (intervention mode) ──
    socket.on('agent:visitor:scroll', (data: { visitorId: string; websiteId: string; deltaX: number; deltaY: number }) => {
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:remote-scroll', { deltaX: data.deltaX, deltaY: data.deltaY })
      }
    })

    // ─── Agent sends keyboard events to visitor (intervention mode) ──
    socket.on('agent:visitor:keydown', (data: { visitorId: string; websiteId: string; key: string; code: string; keyCode: number; shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey: boolean }) => {
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:remote-keydown', data)
      }
    })

    socket.on('agent:visitor:keyup', (data: { visitorId: string; websiteId: string; key: string; code: string; keyCode: number; shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey: boolean }) => {
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:remote-keyup', data)
      }
    })

    // ─── WebRTC Signaling (screen sharing) ──────────────────────
    // Agent requests WebRTC screen sharing start
    socket.on('webrtc:start', (data: { visitorId: string; websiteId: string; agentId: string }) => {
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        // Store the agent's socket ID so we can route signaling back
        const session = visitorSocket[1]
        ;(session as any).webrtcAgentId = data.agentId
        ;(session as any).webrtcAgentSocketId = socket.id
        // Tell the visitor to start WebRTC screen share
        io.to(visitorSocket[0]).emit('visitor:webrtc:start', { agentId: data.agentId })
        console.log(`[Socket] WebRTC screen share requested for visitor ${data.visitorId?.substring(0, 8)}...`)
      } else {
        console.log(`[Socket] No visitor socket found for WebRTC: ${data.visitorId?.substring(0, 8)}...`)
      }
    })

    // Agent or visitor stops WebRTC screen sharing
    socket.on('webrtc:stop', (data: { visitorId: string; websiteId: string; agentId?: string }) => {
      const visitorSocket = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (visitorSocket) {
        io.to(visitorSocket[0]).emit('visitor:webrtc:stop')
      }
      // Also notify the agent if this came from the visitor
      const session = visitorSocket?.[1]
      if (session && (session as any).webrtcAgentSocketId) {
        io.to((session as any).webrtcAgentSocketId).emit('webrtc:stopped', { visitorId: data.visitorId })
      }
      console.log(`[Socket] WebRTC screen share stopped for visitor ${data.visitorId?.substring(0, 8)}...`)
    })

    // WebRTC signaling relay (offer, answer, ICE candidates)
    // IMPORTANT: route by SENDER identity, not by signal.type. Both peers emit
    // ICE candidates with type 'ice-candidate', so type-based routing sent the
    // agent's candidates back to the agent — the visitor never received them and
    // ICE could only complete via peer-reflexive fallback (frozen/laggy video).
    socket.on('webrtc:signal', (data: { visitorId: string; websiteId: string; agentId?: string; signal: { type: string; sdp?: string; candidate?: any } }) => {
      const visitorEntry = Array.from(visitorSessions.entries())
        .find(([_, session]) => session.visitorId === data.visitorId && session.websiteId === data.websiteId)
      if (!visitorEntry) return
      const [visitorSocketId, visitorSession] = visitorEntry

      if (socket.id === visitorSocketId) {
        // Sender is the visitor → forward to the agent that requested the share
        const agentSocketId = (visitorSession as any).webrtcAgentSocketId
        if (agentSocketId) {
          io.to(agentSocketId).emit('webrtc:signal', {
            visitorId: data.visitorId,
            websiteId: data.websiteId,
            signal: data.signal,
          })
        }
      } else {
        // Sender is the agent → forward to the visitor.
        // Also (re)bind the agent socket so visitor→agent signals route back even
        // if an ICE candidate arrives before/around the webrtc:start handshake.
        ;(visitorSession as any).webrtcAgentSocketId = socket.id
        io.to(visitorSocketId).emit('visitor:webrtc:signal', { signal: data.signal })
      }
    })

    // Visitor denied screen sharing permission
    socket.on('webrtc:denied', (data: { visitorId: string; websiteId: string }) => {
      // Broadcast to agents in the website room
      io.to(`website:${data.websiteId}`).emit('webrtc:denied', {
        visitorId: data.visitorId,
        websiteId: data.websiteId,
      })
      console.log(`[Socket] WebRTC screen share denied by visitor ${data.visitorId?.substring(0, 8)}...`)
    })

    // Visitor's screen share stream is ready
    socket.on('webrtc:stream-ready', (data: { visitorId: string; websiteId: string }) => {
      // Notify agents in the website room
      io.to(`website:${data.websiteId}`).emit('webrtc:stream-ready', {
        visitorId: data.visitorId,
        websiteId: data.websiteId,
      })
      console.log(`[Socket] WebRTC stream ready for visitor ${data.visitorId?.substring(0, 8)}...`)
    })

    // ─── Visitor Privacy Mode (sensitive input focus) ───────────────
    socket.on('visitor:privacy-mode', (data: { visitorId: string; websiteId: string; enabled: boolean }) => {
      // Relay privacy mode status to all agents watching this website
      io.to(`website:${data.websiteId}`).emit('agent:visitor:privacy-mode', {
        visitorId: data.visitorId,
        websiteId: data.websiteId,
        enabled: data.enabled,
      })
      if (data.enabled) {
        console.log(`[Socket] Privacy mode ON for visitor ${data.visitorId?.substring(0, 8)}... (sensitive input focused)`)
      }
    })

    // ─── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`)

      // Clean up visitor session
      const visitorSession = visitorSessions.get(socket.id)
      if (visitorSession) {
        // Mark session as ended in DB
        if (visitorSession.sessionId) {
          try {
            await prisma.visitorSession.update({
              where: { sessionId: visitorSession.sessionId },
              data: { endedAt: new Date() },
            })
          } catch {
            // Session may not exist in DB if visitor disconnected before init completed
          }
        }

        // Notify agents about visitor offline
        io.to(`website:${visitorSession.websiteId}`).emit('agent:visitor:offline', {
          visitorId: visitorSession.visitorId,
          websiteId: visitorSession.websiteId,
        })

        visitorSessions.delete(socket.id)
      }

      // Clean up agent online tracking
      const userId = (socket as any).userId
      const websiteIds = (socket as any).websiteIds as string[] | undefined
      if (userId && websiteIds) {
        websiteIds.forEach((websiteId) => {
          const agents = agentOnline.get(websiteId)
          if (agents) {
            agents.delete(userId)
            if (agents.size === 0) {
              agentOnline.delete(websiteId)
            }

            // Notify about agent going offline
            io.to(`website:${websiteId}`).emit('agent:member:offline', {
              userId,
              websiteId,
              onlineCount: agents.size,
            })

            // Notify visitors about updated agent count
            io.to(`website:${websiteId}`).emit('visitor:online', {
              agentsOnline: agents.size,
            })
          }
        })
      }
    })
  })

  return io
}

export function getIO() {
  return io
}

/**
 * Get all live visitor sessions for a website (for REST API fallback)
 */
export function getLiveVisitors(websiteId: string) {
  return Array.from(visitorSessions.values())
    .filter((v) => v.websiteId === websiteId)
    .map((v) => ({
      visitorId: v.visitorId,
      websiteId: v.websiteId,
      currentPage: v.currentPage,
      currentTitle: v.currentTitle,
      cursorX: v.cursorX,
      cursorY: v.cursorY,
      viewportW: v.viewportW,
      viewportH: v.viewportH,
      scrollY: v.scrollY,
      documentH: v.documentH,
      lastScreenshotUrl: v.lastScreenshotUrl,
      lastScreenshotAt: v.lastScreenshotAt?.toISOString() || null,
      connectedAt: v.connectedAt.toISOString(),
      lastActiveAt: v.lastActiveAt.toISOString(),
    }))
}