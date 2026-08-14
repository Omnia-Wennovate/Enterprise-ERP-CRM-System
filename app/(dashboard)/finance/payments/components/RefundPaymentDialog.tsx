'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, RotateCcw, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PaymentWithRelations } from '@/types/finance'

interface RefundPaymentDialogProps {
  payment: PaymentWithRelations | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const fmtCurrency = (v: number, c = 'ETB') =>
  `${c} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`

export default function RefundPaymentDialog({ payment, open, onClose, onSuccess }: RefundPaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const supabase = createClient()

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payment) return

    setLoading(true)
    setError(null)

    try {
      // Basic refund logic - mark payment as refunded and add a note
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          notes: (payment.notes ? payment.notes + '\n\n' : '') + `[Refunded] Reason: ${reason}`
        })
        .eq('id', payment.id)

      if (updateError) throw updateError

      // Re-calculate the invoice status based on remaining payments
      const { data: inv } = await supabase
        .from('invoices')
        .select('total_amount, id')
        .eq('id', payment.invoice_id)
        .single()

      if (inv) {
        const { data: otherPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('invoice_id', payment.invoice_id)
          .eq('status', 'completed')

        const totalPaid = (otherPayments || []).reduce((s, p) => s + p.amount, 0)
        
        let newStatus = 'sent'
        if (totalPaid >= inv.total_amount) newStatus = 'paid'
        else if (totalPaid > 0) newStatus = 'partially_paid'
        
        // Check if overdue
        if (newStatus !== 'paid') {
          const { data: checkDue } = await supabase.from('invoices').select('due_date').eq('id', payment.invoice_id).single()
          if (checkDue && new Date(checkDue.due_date) < new Date()) {
            newStatus = 'overdue'
          }
        }

        await supabase.from('invoices').update({ status: newStatus }).eq('id', payment.invoice_id)
      }

      onSuccess()
      onClose()
      setReason('')
    } catch (err: any) {
      setError(err.message || 'Failed to process refund')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !payment) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border/50 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Refund Payment</h2>
                <p className="text-xs text-muted-foreground font-mono">{payment.id.slice(0, 8)}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-2 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-sm text-purple-700 font-medium mb-1">You are about to refund:</p>
              <p className="text-2xl font-bold text-foreground">
                {fmtCurrency(payment.amount, payment.invoice_currency)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This will mark the payment as refunded and recalculate the balance for Invoice <span className="font-mono text-foreground">{payment.invoice_number}</span>.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleRefund} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Reason for Refund</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-purple-500/30 outline-none text-sm resize-none"
                  placeholder="E.g., Customer overpaid, booking cancelled..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason.trim()}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 rounded-xl transition-colors shadow-lg shadow-purple-500/25 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
