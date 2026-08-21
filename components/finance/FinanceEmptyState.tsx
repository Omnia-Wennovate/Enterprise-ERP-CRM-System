import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface FinanceEmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function FinanceEmptyState({
  title,
  description,
  icon,
  action,
}: FinanceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#C8A951]/10 flex items-center justify-center mb-4 text-[#C8A951]">
        {icon ?? <Inbox size={28} strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold text-[#0A1221] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
