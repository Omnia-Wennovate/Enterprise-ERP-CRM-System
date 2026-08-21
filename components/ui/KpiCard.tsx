'use client'

import { useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  icon: string
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  accentColor?: string
  className?: string
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    DollarSign: LucideIcons.DollarSign,
    Plane: LucideIcons.Plane,
    Users: LucideIcons.Users,
    TrendingUp: LucideIcons.TrendingUp,
    TrendingDown: LucideIcons.TrendingDown,
    Receipt: LucideIcons.Receipt,
    BarChart2: LucideIcons.BarChart2,
    Activity: LucideIcons.Activity,
    AlertCircle: LucideIcons.AlertCircle,
    Award: LucideIcons.Award,
    Target: LucideIcons.Target,
    Calendar: LucideIcons.Calendar,
    CheckCircle: LucideIcons.CheckCircle,
    CreditCard: LucideIcons.CreditCard,
    Clock: LucideIcons.Clock,
    FileText: LucideIcons.FileText,
    BookOpen: LucideIcons.BookOpen,
    Briefcase: LucideIcons.Briefcase,
    Package: LucideIcons.Package,
    Megaphone: LucideIcons.Megaphone,
    Eye: LucideIcons.Eye,
    MousePointer: LucideIcons.MousePointer,
    Zap: LucideIcons.Zap,
  }
  return icons[iconName] || LucideIcons.Circle
}

export function KpiCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  accentColor,
  className,
}: KpiCardProps) {
  const Icon = getIconComponent(icon)
  const isPositive = trend !== undefined && trend >= 0
  const valueRef = useRef<HTMLParagraphElement>(null)

  // Subtle counter animation on mount
  useEffect(() => {
    const el = valueRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(6px)'
    const timer = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 p-5 relative overflow-hidden group',
        className
      )}
    >
      {/* Gold top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accentColor || 'var(--omnia-gold)' }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {label}
          </p>
          <p
            ref={valueRef}
            className="text-2xl font-bold text-foreground mb-2 tabular-nums"
          >
            {value}
          </p>

          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="text-success flex-shrink-0" size={14} />
              ) : (
                <TrendingDown className="text-destructive flex-shrink-0" size={14} />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend > 0 ? '+' : ''}
                {trend}% {trendLabel || 'vs last month'}
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: `${accentColor || 'var(--omnia-gold)'}18` }}
        >
          <Icon
            className="flex-shrink-0"
            size={20}
            style={{ color: accentColor || 'var(--omnia-gold)' }}
          />
        </div>
      </div>
    </div>
  )
}
