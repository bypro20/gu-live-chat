/** Lightweight web context for AI — DuckDuckGo instant answers + related topics. */
export async function fetchWebContext(query: string, maxChars = 1800): Promise<string> {
  const q = query.trim()
  if (!q || q.length < 4) return ''

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return ''

    const data = (await res.json()) as {
      AbstractText?: string
      Heading?: string
      RelatedTopics?: Array<{ Text?: string; Topics?: Array<{ Text?: string }> }>
    }

    const parts: string[] = []
    if (data.AbstractText?.trim()) {
      parts.push(data.Heading ? `${data.Heading}: ${data.AbstractText}` : data.AbstractText)
    }

    for (const topic of data.RelatedTopics ?? []) {
      if (topic.Text?.trim()) parts.push(topic.Text)
      for (const sub of topic.Topics ?? []) {
        if (sub.Text?.trim()) parts.push(sub.Text)
      }
      if (parts.join(' ').length > maxChars) break
    }

    const combined = parts.join('\n').trim()
    return combined.length > maxChars ? combined.slice(0, maxChars) + '…' : combined
  } catch {
    return ''
  }
}
