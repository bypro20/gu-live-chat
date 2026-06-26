const CHUNK_SIZE = 520
const CHUNK_OVERLAP = 80

export interface TextChunk {
  title: string
  content: string
}

/** Split long text into overlapping chunks for embedding. */
export function splitTextIntoChunks(title: string, text: string): TextChunk[] {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!clean) return []

  if (clean.length <= CHUNK_SIZE) {
    return [{ title, content: clean }]
  }

  const chunks: TextChunk[] = []
  let start = 0
  let index = 1

  while (start < clean.length) {
    let end = Math.min(start + CHUNK_SIZE, clean.length)
    if (end < clean.length) {
      const slice = clean.slice(start, end)
      const breakAt = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('. '))
      if (breakAt > CHUNK_SIZE * 0.4) end = start + breakAt + 1
    }

    const content = clean.slice(start, end).trim()
    if (content) {
      chunks.push({
        title: chunks.length === 0 ? title : `${title} (${index})`,
        content,
      })
      index++
    }

    if (end >= clean.length) break
    start = Math.max(end - CHUNK_OVERLAP, start + 1)
  }

  return chunks
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}
