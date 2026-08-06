import React from 'react'
import type { ExpirationSeverity } from '@/types/documents'

export function DocumentExpirationBadge({ severity, label }: { severity: ExpirationSeverity, label: string }) {
  const colors = {
    expired: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-rose-100 text-rose-800 border-rose-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    caution: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ok: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[severity]}`}>
      {label}
    </span>
  )
}
