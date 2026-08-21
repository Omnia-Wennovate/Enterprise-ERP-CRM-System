'use client'

import { KpiCard } from '@/components/ui/KpiCard'

interface StatsCardProps {
  icon: string
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  accentColor?: string
}

/**
 * StatsCard — thin wrapper around the shared KpiCard component.
 * Preserved for backward compatibility with existing dashboard usage.
 */
export function StatsCard(props: StatsCardProps) {
  return <KpiCard {...props} />
}
