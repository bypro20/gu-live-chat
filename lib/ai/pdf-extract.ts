/** Extract readable text from PDF bytes without native dependencies. */
export function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString('latin1')
  const chunks: string[] = []

  const tjMatches = raw.match(/\((?:\\.|[^\\)])*\)\s*Tj/g) ?? []
  for (const m of tjMatches) {
    const inner = m.replace(/\s*Tj$/, '').slice(1, -1)
    chunks.push(decodePdfString(inner))
  }

  const streamMatches = raw.match(/stream[\r\n]+([\s\S]*?)endstream/g) ?? []
  for (const block of streamMatches.slice(0, 24)) {
    const body = block.replace(/^stream[\r\n]+/, '').replace(/endstream$/, '')
    const words = body.match(/[A-Za-z0-9ğüşöçıİĞÜŞÖÇ][A-Za-z0-9ğüşöçıİĞÜŞÖÇ\s.,!?%-]{3,}/g)
    if (words) chunks.push(...words.slice(0, 40))
  }

  const text = chunks
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length < 40) {
    throw new Error('PDF metni çıkarılamadı — metni kopyalayıp yapıştırın veya URL kullanın')
  }
  return text.slice(0, 120_000)
}

function decodePdfString(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
}
