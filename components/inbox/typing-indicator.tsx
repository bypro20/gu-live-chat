'use client'

import { inboxVisitorBubbleStyle } from '@/lib/inbox-theme'

export function TypingIndicator({ preview }: { preview?: string }) {
  return (
    <div className="flex justify-start mt-2">
      <div className="flex items-end gap-2 max-w-[min(78%,420px)]">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 border-2 border-white shrink-0 flex items-center justify-center text-[10px] text-indigo-600 font-bold shadow-sm">
          Z
        </div>
        <div className="px-4 py-3 rounded-[8px_22px_22px_22px]" style={inboxVisitorBubbleStyle()}>
          {preview ? (
            <p className="text-sm text-slate-500 italic truncate max-w-[280px]">{preview}</p>
          ) : (
            <div className="flex items-center gap-1.5 h-5 px-0.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400/70 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-indigo-400/70 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-indigo-400/70 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
