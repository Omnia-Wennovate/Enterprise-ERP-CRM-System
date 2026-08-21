'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
  )
}

export function SkeletonKpi({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-5', className)}>
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-7 w-24 mb-3" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-muted/50">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-b-0">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-5', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-3.5 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

export function SkeletonProfile({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-6', className)}>
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div>
          <Skeleton className="h-5 w-36 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export { Skeleton }
