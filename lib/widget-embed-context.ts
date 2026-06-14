import { isValidCustomerEmbedUrl, normalizeExternalUrl } from '@/lib/widget-embed-url'

export type WidgetEmbedContext = {
  embedUrl: string | null
  embedReferrer: string | null
  embedTitle: string | null
}

export function readEmbedContextFromSearchParams(searchParams: URLSearchParams): WidgetEmbedContext {
  const rawUrl = searchParams.get('embedUrl')
  const embedUrl = isValidCustomerEmbedUrl(rawUrl) ? normalizeExternalUrl(rawUrl) : null
  const embedReferrer = searchParams.get('embedReferrer')?.trim() || null
  const embedTitle = searchParams.get('embedTitle')?.trim() || null
  return { embedUrl, embedReferrer, embedTitle }
}

export function waitForParentEmbedContext(timeoutMs = 900): Promise<WidgetEmbedContext> {
  if (typeof window === 'undefined' || window.parent === window) {
    return Promise.resolve({ embedUrl: null, embedReferrer: null, embedTitle: null })
  }

  return new Promise((resolve) => {
    const finish = (ctx: WidgetEmbedContext) => {
      clearTimeout(timer)
      window.removeEventListener('message', handler)
      resolve(ctx)
    }

    const timer = setTimeout(() => finish({ embedUrl: null, embedReferrer: null, embedTitle: null }), timeoutMs)

    const handler = (event: MessageEvent) => {
      const data = event.data
      if (data?.type !== 'gu:pageview' && data?.type !== 'gu:embed-context') return
      if (!data.url) return

      finish({
        embedUrl: isValidCustomerEmbedUrl(data.url) ? normalizeExternalUrl(data.url) : null,
        embedReferrer: typeof data.referrer === 'string' ? data.referrer.trim() || null : null,
        embedTitle: typeof data.title === 'string' ? data.title.trim() || null : null,
      })
    }

    window.addEventListener('message', handler)
    window.parent.postMessage({ type: 'gu:request-pageview' }, '*')
  })
}

export async function resolveWidgetEmbedContext(
  searchParams: URLSearchParams,
): Promise<WidgetEmbedContext> {
  const fromQuery = readEmbedContextFromSearchParams(searchParams)
  if (fromQuery.embedUrl) return fromQuery

  const fromParent = await waitForParentEmbedContext()
  return {
    embedUrl: fromParent.embedUrl,
    embedReferrer: fromQuery.embedReferrer || fromParent.embedReferrer,
    embedTitle: fromQuery.embedTitle || fromParent.embedTitle,
  }
}

export async function recordWidgetPageview(input: {
  sessionId: string
  url: string
  title?: string | null
  referrer?: string | null
}) {
  if (!isValidCustomerEmbedUrl(input.url)) return

  await fetch('/api/widget/session/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: input.sessionId,
      url: input.url,
      title: input.title || '',
      referrer: input.referrer || '',
    }),
  })
}
