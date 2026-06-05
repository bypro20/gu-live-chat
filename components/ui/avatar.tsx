'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'away' | 'offline' | 'busy'
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-9 h-9 text-[13px]',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-14 h-14 text-base',
}

const statusColors = {
  online: 'bg-success',
  away: 'bg-warning',
  offline: 'bg-muted-foreground',
  busy: 'bg-destructive',
}

export function Avatar({ src, alt, fallback, size = 'md', status, className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false)
  const showImage = src && !error
  const initial = (fallback || alt || '?').charAt(0).toUpperCase()

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full overflow-hidden font-semibold text-white shadow-sm',
          'bg-gradient-to-br from-primary to-[#A78BFA]',
          sizes[size]
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || ''}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-card',
            statusColors[status],
            size === 'xs' ? 'w-1.5 h-1.5' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
          )}
        />
      )}
    </div>
  )
}
