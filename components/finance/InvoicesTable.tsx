'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Trash2 } from 'lucide-react'
import { cancelInvoiceAction } from '@/app/actions/invoices'
import type { Invoice } from '@/types/finance'

interface InvoicesTableProps {
  invoices: Invoice[]
  onRefresh?: () => void
}

const statusColors = {
  draft: { bg: 'bg-muted', text: 'text-slate-700', border: 'border-border' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  paid: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  partially_paid: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  cancelled: { bg: 'bg-muted', text: 'text-slate-700', border: 'border-border' },
}

const formatCurrency = (value: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function InvoicesTable({ invoices, onRefresh }: InvoicesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCancel = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return

    try {
      setDeletingId(invoiceId)
      await cancelInvoiceAction(invoiceId)
      onRefresh?.()
    } catch (error) {
      console.error('Failed to cancel invoice:', error)
      alert('Failed to cancel invoice')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Invoice Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Due Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {invoices.map((invoice) => {
            const statusColor = statusColors[invoice.status] || statusColors.draft
            return (
              <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/finance/invoices/${invoice.id}`}
                    className="font-semibold text-omnia-gold hover:text-omnia-gold-dark"
                  >
                    {invoice.invoice_number}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{invoice.customer_id}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                  {formatCurrency(invoice.total_amount, invoice.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                  >
                    {invoice.status.replace('_', ' ').charAt(0).toUpperCase() +
                      invoice.status.replace('_', ' ').slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      invoice.priority === 'high' ? 'bg-red-100 text-red-700' : 
                      invoice.priority === 'low' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {(invoice.priority || 'normal').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{formatDate(invoice.due_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                  <Link
                    href={`/finance/invoices/${invoice.id}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(invoice.id)}
                      disabled={deletingId === invoice.id}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
