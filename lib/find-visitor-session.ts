export type VisitorSessionMatch = {
  visitorId: string
  websiteId: string
  sessionId?: string
}

/** Socket oturumunu visitorId veya sessionId ile eşle. */
export function matchVisitorSession<T extends VisitorSessionMatch>(
  sessions: T[],
  query: { visitorId: string; websiteId: string; sessionId?: string }
): T | undefined {
  if (!query.websiteId || !query.visitorId) return undefined
  return sessions.find((session) => {
    if (session.websiteId !== query.websiteId) return false
    if (session.visitorId === query.visitorId) return true
    if (query.sessionId && session.sessionId && session.sessionId === query.sessionId) return true
    if (session.sessionId && session.sessionId === query.visitorId) return true
    return false
  })
}
