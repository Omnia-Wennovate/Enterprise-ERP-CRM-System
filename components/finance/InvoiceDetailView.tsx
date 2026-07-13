'use client'

import type { InvoiceDetail } from '@/types/finance'

interface InvoiceDetailViewProps {
  invoice: InvoiceDetail
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function InvoiceDetailView({ invoice }: InvoiceDetailViewProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Invoice Header */}
      <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-8 border-b border-teal-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{invoice.invoice_number}</h2>
            <p className="text-slate-600 mt-1">Issued: {formatDate(invoice.issued_date)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-600">Due Date</p>
            <p className="text-lg font-bold text-slate-900">{formatDate(invoice.due_date)}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-block">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              invoice.status === 'paid'
                ? 'bg-green-100 text-green-700'
                : invoice.status === 'partially_paid'
                  ? 'bg-amber-100 text-amber-700'
                  : invoice.status === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : invoice.status === 'sent'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700'
            }`}
          >
            {invoice.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Customer & Booking Info */}
      <div className="grid grid-cols-2 gap-6 p-8 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase mb-2">Bill To</h4>
          <p className="text-lg font-semibold text-slate-900">{invoice.customer_name || 'N/A'}</p>
          <p className="text-slate-600 mt-1">{invoice.customer_id}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase mb-2">Booking</h4>
          <p className="text-lg font-semibold text-slate-900">
            {invoice.booking_reference || 'N/A'}
          </p>
        </div>
      </div>

      {/* Line Items */}
      <div className="p-8 border-b border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 uppercase mb-4">Line Items</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 font-semibold text-slate-700">Description</th>
              <th className="text-right py-2 font-semibold text-slate-700 w-20">Qty</th>
              <th className="text-right py-2 font-semibold text-slate-700 w-28">Unit Price</th>
              <th className="text-right py-2 font-semibold text-slate-700 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-3 text-slate-900">{item.description}</td>
                <td className="text-right text-slate-600">{item.quantity}</td>
                <td className="text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                <td className="text-right font-medium text-slate-900">
                  {formatCurrency(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="p-8 bg-slate-50">
        <div className="flex justify-end max-w-xs ml-auto space-y-2">
          <div className="flex justify-between w-full">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(invoice.amount)}</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-slate-600">Tax:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between w-full border-t border-slate-300 pt-2">
            <span className="font-bold text-slate-900">Total:</span>
            <span className="text-lg font-bold text-teal-600">
              {formatCurrency(invoice.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payments Info */}
      <div className="p-8 bg-blue-50 border-t border-blue-200">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-blue-700 font-semibold">Amount Paid</p>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(invoice.total_amount - invoice.outstanding_balance)}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-semibold">Outstanding</p>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(invoice.outstanding_balance)}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-semibold">Payments</p>
            <p className="text-xl font-bold text-blue-900">{invoice.payments.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
