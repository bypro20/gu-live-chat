'use client'

import { cn } from '@/lib/utils'
import { channelColor, channelLabel } from '@/lib/conversation-channels'

export function ChannelBadge({
  source,
  size = 'sm',
  className,
}: {
  source?: string | null
  size?: 'sm' | 'xs'
  className?: string
}) {
  const meta = { label: channelLabel(source), color: channelColor(source) }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium shrink-0',
        size === 'xs' ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5',
        className
      )}
      style={{
        backgroundColor: `${meta.color}18`,
        color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}
      title={meta.label}
    >
      <span
        className="rounded-full shrink-0"
        style={{
          width: size === 'xs' ? 5 : 6,
          height: size === 'xs' ? 5 : 6,
          backgroundColor: meta.color,
        }}
      />
      {meta.label}
    </span>
  )
}
