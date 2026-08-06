'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/types/finance'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const supabase = await createClient()
      const { data } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })

      setPayments(data || [])
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = payments.reduce((sum, p) => p.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-1">View all recorded payments</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-primary-foreground rounded-lg hover:bg-slate-700 transition-colors font-medium">
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-card rounded-lg shadow p-6">
            <p className="text-muted-foreground text-sm font-medium">Total Payments</p>
            <p className="text-3xl font-bold text-foreground mt-2">{payments.length}</p>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <p className="text-muted-foreground text-sm font-medium">Total Amount</p>
            <p className="text-3xl font-bold text-teal-600 mt-2">
              ${totalAmount.toFixed(2)}
            </p>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <p className="text-muted-foreground text-sm font-medium">This Month</p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {
                payments.filter((p) => {
                  const date = new Date(p.payment_date)
                  const now = new Date()
                  return (
                    date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  )
                }).length
              }
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No payments recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Invoice
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {payment.invoice_id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-teal-600">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {payment.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {payment.reference_number || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
