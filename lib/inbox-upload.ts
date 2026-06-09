export type UploadedFile = {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

export async function uploadInboxFile(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Dosya yüklenemedi')
  }
  return {
    url: data.url,
    fileName: data.fileName || data.originalName || file.name,
    fileSize: data.fileSize ?? file.size,
    mimeType: data.mimeType || file.type,
  }
}

export function attachmentContent(
  upload: UploadedFile,
  caption?: string
): { content: string; type: 'TEXT' | 'IMAGE' | 'FILE' } {
  const isImg = upload.mimeType.startsWith('image/')
  const type = isImg ? 'IMAGE' : 'FILE'
  const content =
    caption?.trim() ||
    (isImg ? `🖼️ ${upload.fileName}` : `📎 ${upload.fileName}`)
  return { content, type }
}
