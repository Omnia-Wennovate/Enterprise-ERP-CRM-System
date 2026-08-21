'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /** Small uppercase kicker text above the title (e.g. "CRM", "Finance") */
  kicker?: string
  /** Main page title */
  title: string
  /** Optional subtitle below the title */
  subtitle?: string
  /** Optional right-side content (action buttons, filters) */
  actions?: React.ReactNode
  /** Optional back button props */
  backHref?: string
  backLabel?: string
  className?: string
}

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
  backHref,
  backLabel,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {/* Back button */}
      {backHref && (
        <a
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {backLabel || 'Back'}
        </a>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {kicker && (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-omnia-gold mb-1.5">
              {kicker}
            </p>
          )}
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
