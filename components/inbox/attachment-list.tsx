'use client'

import { FileText, Download } from 'lucide-react'
import type { InboxAttachment } from './types'
import { attName, attSize, formatBytes, isImageAtt } from './utils'

export function AttachmentList({
  attachments,
  variant = 'light',
}: {
  attachments: InboxAttachment[]
  variant?: 'light' | 'dark'
}) {
  if (!attachments?.length) return null
  const onDark = variant === 'dark'

  return (
    <div className="flex flex-col gap-2 mt-2">
      {attachments.map((a, i) =>
        isImageAtt(a) ? (
          <a
            key={a.id || i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <img
              src={a.url}
              alt={attName(a)}
              className="max-w-[min(280px,100%)] max-h-[220px] w-auto rounded-lg border border-border/60 object-cover transition group-hover:opacity-95"
              loading="lazy"
            />
          </a>
        ) : (
          <a
            key={a.id || i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            download={attName(a)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 max-w-[280px] no-underline transition hover:opacity-90 ${
              onDark ? 'bg-primary-foreground/10' : 'bg-background/80 border border-border/50'
            }`}
          >
            <span
              className={`flex items-center justify-center w-9 h-9 rounded-md shrink-0 ${
                onDark ? 'bg-primary-foreground/15' : 'bg-muted'
              }`}
            >
              <FileText className={`w-4 h-4 ${onDark ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[13px] font-medium truncate ${
                  onDark ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {attName(a)}
              </span>
              <span
                className={`flex items-center gap-1 text-[11px] ${
                  onDark ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}
              >
                {formatBytes(attSize(a))}
                {attSize(a) ? ' · ' : ''}
                <Download className="w-3 h-3" />
                İndir
              </span>
            </span>
          </a>
        )
      )}
    </div>
  )
}
