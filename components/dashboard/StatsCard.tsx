'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface StatsCardProps {
  icon: string
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  accentColor?: string
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    DollarSign: LucideIcons.DollarSign,
    Plane: LucideIcons.Plane,
    Users: LucideIcons.Users,
    TrendingUp: LucideIcons.TrendingUp,
    Receipt: LucideIcons.Receipt,
    BarChart2: LucideIcons.BarChart2,
    Activity: LucideIcons.Activity,
    AlertCircle: LucideIcons.AlertCircle,
    Award: LucideIcons.Award,
    Target: LucideIcons.Target,
    Calendar: LucideIcons.Calendar,
    CheckCircle: LucideIcons.CheckCircle,
  }
  return icons[iconName] || LucideIcons.Circle
}

export function StatsCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  accentColor = '#0A8FA8',
}: StatsCardProps) {
  const Icon = getIconComponent(icon)
  const isPositive = trend && trend >= 0

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Top accent bar */}
      <div
        className="w-full h-1 -mx-6 -mt-6 mb-4 rounded-t-xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* Icon and content */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground mb-3">{value}</p>

          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="text-success" size={16} />
              ) : (
                <TrendingDown className="text-destructive" size={16} />
              )}
              <span
                className={`text-xs font-medium ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {trend > 0 ? '+' : ''}{trend}% {trendLabel || 'vs last month'}
              </span>
            </div>
          )}
        </div>

        {/* Icon circle */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <Icon className="flex-shrink-0" size={20} style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  )
}
