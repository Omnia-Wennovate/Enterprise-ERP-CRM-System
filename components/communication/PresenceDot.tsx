'use client'

import { usePresence } from './PresenceProvider'
import { cn } from '@/lib/utils'

interface PresenceDotProps {
  userId: string
  /** Outer wrapper className for positioning (e.g., 'absolute bottom-0 right-0') */
  className?: string
  size?: 'sm' | 'md'
}

const STATUS_COLORS = {
  online: 'bg-green-500',
  away: 'bg-yellow-400',
  offline: 'bg-slate-300',
}

export function PresenceDot({ userId, className, size = 'sm' }: PresenceDotProps) {
  const { getStatus } = usePresence()
  const status = getStatus(userId)
  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'

  return (
    <span
      className={cn(
        'rounded-full border-2 border-white inline-block flex-shrink-0',
        sizeClass,
        STATUS_COLORS[status],
        className
      )}
      aria-label={`Status: ${status}`}
      title={status}
    />
  )
}

/** Standalone status indicator with label */
export function PresenceStatus({ userId }: { userId: string }) {
  const { getStatus } = usePresence()
  const status = getStatus(userId)
  const labels: Record<string, string> = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline',
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[status])} />
      {labels[status]}
    </span>
  )
}
