import { InvoiceStatus, SupplierPaymentStatus, CommissionStatus, RefundStatus } from '@/types/finance'

type AnyStatus =
  | InvoiceStatus
  | SupplierPaymentStatus
  | CommissionStatus
  | RefundStatus
  | 'pending' | 'paid' | 'overdue' | 'approved' | 'rejected' | 'cancelled'
  | 'draft' | 'sent' | 'partially_paid' | 'scheduled'
  | string

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  // Invoice
  draft:           { label: 'Draft',           classes: 'bg-slate-100 text-slate-600' },
  sent:            { label: 'Sent',            classes: 'bg-blue-50 text-blue-700' },
  paid:            { label: 'Paid',            classes: 'bg-emerald-50 text-emerald-700' },
  partially_paid:  { label: 'Partial',         classes: 'bg-teal-50 text-teal-700' },
  overdue:         { label: 'Overdue',         classes: 'bg-red-50 text-red-700' },
  cancelled:       { label: 'Cancelled',       classes: 'bg-slate-100 text-slate-500' },
  // Supplier
  pending:         { label: 'Pending',         classes: 'bg-amber-50 text-amber-700' },
  scheduled:       { label: 'Scheduled',       classes: 'bg-blue-50 text-blue-700' },
  // Commission
  approved:        { label: 'Approved',        classes: 'bg-indigo-50 text-indigo-700' },
  // Refund
  rejected:        { label: 'Rejected',        classes: 'bg-red-50 text-red-700' },
  // Generic
  completed:       { label: 'Completed',       classes: 'bg-emerald-50 text-emerald-700' },
  processing:      { label: 'Processing',      classes: 'bg-blue-50 text-blue-600' },
}

interface FinanceStatusBadgeProps {
  status: AnyStatus
  size?: 'sm' | 'md'
}

export function FinanceStatusBadge({ status, size = 'md' }: FinanceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, ' '),
    classes: 'bg-slate-100 text-slate-600',
  }
  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-1 text-xs'

  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${sizeClass} ${config.classes}`}>
      {config.label}
    </span>
  )
}
