'use client'

import type { Payment } from '@/types/finance'

interface PaymentsTableProps {
  payments: Payment[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div>
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
              Method
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
              Reference
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                {formatDate(payment.payment_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-semibold text-teal-600">
                {formatCurrency(payment.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                {payment.payment_method.replace('_', ' ').toUpperCase()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                {payment.reference_number || '—'}
              </td>
              <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{payment.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer with total */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-sm text-slate-600">Total Paid</p>
            <p className="text-2xl font-bold text-teal-600">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
