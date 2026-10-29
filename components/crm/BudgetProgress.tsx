'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'

interface BudgetProgressProps {
  budget: number | string | null | undefined
  paid: number | string | null | undefined
  currency?: string
  /** Single-line version for pipeline cards */
  compact?: boolean
}

/** Shows how much of a lead's budget is paid, e.g. "60% paid · 40% left". */
export function BudgetProgress({ budget, paid, currency = 'USD', compact = false }: BudgetProgressProps) {
  const total = Number(budget) || 0
  const paidAmount = Number(paid) || 0
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  if (total <= 0) {
    return paidAmount > 0 && !compact ? (
      <p className="text-xs text-muted-foreground">Enter a budget to see how much is left to pay.</p>
    ) : null
  }

  const overpaid = paidAmount > total
  const fullyPaid = paidAmount >= total
  // Floor so 99.6% never displays as "100% paid" while money is still owed
  const paidPct = fullyPaid ? 100 : Math.floor((paidAmount / total) * 100)
  const remaining = Math.max(0, total - paidAmount)

  if (compact) {
    return (
      <div className="space-y-1" title={`Paid ${fmt(paidAmount)} of ${fmt(total)}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">{paidPct}% paid</span>
          {fullyPaid ? (
            <span className="font-medium text-emerald-600">Fully paid</span>
          ) : (
            <span className="text-amber-600">{fmt(remaining)} left</span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full ${fullyPaid ? 'bg-emerald-500' : 'bg-omnia-gold'}`}
            style={{ width: `${paidPct}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{paidPct}% paid</span>
        {fullyPaid ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
            <CheckCircle2 size={14} /> Fully paid
          </span>
        ) : (
          <span className="font-semibold text-amber-600">{100 - paidPct}% left</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fullyPaid ? 'bg-emerald-500' : 'bg-omnia-gold'}`}
          style={{ width: `${paidPct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Paid {fmt(paidAmount)} of {fmt(total)}
        {!fullyPaid && <> · <span className="text-foreground font-medium">{fmt(remaining)} remaining</span></>}
      </p>
      {overpaid && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle size={12} /> Amount paid is {fmt(paidAmount - total)} more than the budget.
        </p>
      )}
    </div>
  )
}
