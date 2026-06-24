'use client'

import { inboxBubbleRadius, inboxVisitorBubbleStyle } from '@/lib/inbox-theme'

export function TypingIndicator({ preview }: { preview?: string }) {
  return (
    <div className="flex justify-start mt-3 inbox-message-enter">
      <div className="flex items-end gap-2 max-w-[min(78%,420px)]">
        <div className="w-8 h-8 rounded-full bg-muted border border-border shrink-0 flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
          Z
        </div>
        <div className={`px-3.5 py-2.5 ${inboxBubbleRadius(true, false, true)}`} style={inboxVisitorBubbleStyle()}>
          {preview ? (
            <p className="text-sm text-muted-foreground italic truncate max-w-[280px]">{preview}</p>
          ) : (
            <div className="flex items-center gap-1 h-5 px-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:240ms]" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
