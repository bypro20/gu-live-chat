'use client'

export function TypingIndicator({ preview }: { preview?: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[min(78%,420px)]">
        <div className="w-7 h-7 rounded-full bg-muted border border-border shrink-0 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
          ···
        </div>
        <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-card border border-border shadow-sm">
          {preview ? (
            <p className="text-sm text-muted-foreground italic truncate max-w-[280px]">{preview}</p>
          ) : (
            <div className="flex items-center gap-1 h-5 px-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
