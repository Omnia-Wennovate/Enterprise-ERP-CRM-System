'use client'

import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { PassportStatus } from '@/types/documents'

interface PassportStatusBadgeProps {
  status: PassportStatus
  size?: 'sm' | 'md'
}

const CONFIG: Record<
  PassportStatus,
  { icon: React.ElementType; label: string; className: string }
> = {
  valid: {
    icon: CheckCircle2,
    label: 'Valid',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  expiring_soon: {
    icon: AlertTriangle,
    label: 'Expiring Soon',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  expired: {
    icon: XCircle,
    label: 'Expired',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
}

export function PassportStatusBadge({ status, size = 'sm' }: PassportStatusBadgeProps) {
  const { icon: Icon, label, className } = CONFIG[status]
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold border rounded-full ${padding} ${textSize} ${className}`}
    >
      <Icon className={iconSize} />
      {label}
    </span>
  )
}
