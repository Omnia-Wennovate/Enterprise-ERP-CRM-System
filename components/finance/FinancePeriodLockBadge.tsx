import { Lock } from 'lucide-react'

interface FinancePeriodLockBadgeProps {
  month: number
  year: number
  compact?: boolean
}

export function FinancePeriodLockBadge({ month, year, compact }: FinancePeriodLockBadgeProps) {
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'short' })
  return (
    <span
      title={`Period ${monthName} ${year} is closed. Contact Finance Admin to reopen.`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200"
    >
      <Lock size={9} />
      {!compact && `${monthName} ${year} Closed`}
    </span>
  )
}
