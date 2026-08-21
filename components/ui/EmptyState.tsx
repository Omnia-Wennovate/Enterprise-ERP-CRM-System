'use client'

import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  /** Primary action button */
  actionLabel?: string
  onAction?: () => void
  /** Secondary action */
  secondaryLabel?: string
  onSecondary?: () => void
  className?: string
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    Inbox: LucideIcons.Inbox,
    Users: LucideIcons.Users,
    FileText: LucideIcons.FileText,
    Plane: LucideIcons.Plane,
    DollarSign: LucideIcons.DollarSign,
    Search: LucideIcons.Search,
    Calendar: LucideIcons.Calendar,
    MessageSquare: LucideIcons.MessageSquare,
    BarChart2: LucideIcons.BarChart2,
    FolderOpen: LucideIcons.FolderOpen,
    Package: LucideIcons.Package,
    CreditCard: LucideIcons.CreditCard,
    Receipt: LucideIcons.Receipt,
    Target: LucideIcons.Target,
    BookOpen: LucideIcons.BookOpen,
    Briefcase: LucideIcons.Briefcase,
  }
  return icons[iconName] || LucideIcons.Inbox
}

export function EmptyState({
  icon = 'Inbox',
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: EmptyStateProps) {
  const Icon = getIconComponent(icon)

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6', className)}>
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="text-muted-foreground" size={28} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
          {description}
        </p>
      )}
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-omnia-gold text-white hover:bg-omnia-gold-dark transition-colors"
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}
