'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { fetchInvoiceDetail, recordPaymentAction, fetchPaymentsByInvoice } from '@/app/actions/invoices'
import { InvoiceDetailView } from '@/components/finance/InvoiceDetailView'
import { PaymentForm } from '@/components/finance/PaymentForm'
import { PaymentsTable } from '@/components/finance/PaymentsTable'
import type { InvoiceDetail, Payment, PaymentMethod } from '@/types/finance'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const [id, setId] = useState<string>('')
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  useEffect(() => {
    params.then((p) => {
      setId(p.id)
      loadInvoice(p.id)
    })
  }, [params])

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true)
      const [invoiceData, paymentsData] = await Promise.all([
        fetchInvoiceDetail(invoiceId),
        fetchPaymentsByInvoice(invoiceId),
      ])

      if (invoiceData) {
        setInvoice(invoiceData)
      }
      setPayments(paymentsData || [])
    } catch (error) {
      console.error('Failed to load invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (formData: {
    amount: number
    payment_method: PaymentMethod
    payment_date: string
    reference_number?: string
    notes?: string
  }) => {
    try {
      await recordPaymentAction({
        invoice_id: id,
        ...formData,
      })
      setShowPaymentForm(false)
      await loadInvoice(id)
    } catch (error) {
      console.error('Failed to record payment:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F7FA] flex items-center justify-center">
        <div className="text-slate-600">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#F0F7FA]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600 mb-4">Invoice not found</p>
            <Link href="/finance/invoices" className="text-teal-600 hover:text-teal-700">
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/finance/invoices"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{invoice.invoice_number}</h1>
            <p className="text-slate-600 mt-1">{invoice.customer_name}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Invoice Detail */}
          <div className="col-span-2">
            <InvoiceDetailView invoice={invoice} />
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-8">
            <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">Subtotal</span>
                <span className="font-semibold">${invoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">Tax</span>
                <span className="font-semibold">${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-teal-600">
                  ${invoice.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700 font-semibold">Outstanding</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${invoice.outstanding_balance.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Record Payment
              </button>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        {showPaymentForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="font-semibold text-slate-900 mb-4">Record Payment</h3>
            <PaymentForm
              maxAmount={invoice.outstanding_balance}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setShowPaymentForm(false)}
            />
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">
              Payments ({payments.length})
            </h3>
          </div>
          {payments.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-600">
              No payments recorded yet
            </div>
          ) : (
            <PaymentsTable payments={payments} />
          )}
        </div>
      </div>
    </div>
  )
}
