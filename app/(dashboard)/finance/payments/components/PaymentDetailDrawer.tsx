'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, DollarSign, Calendar, CreditCard, FileText, User, MapPin,
  Copy, CheckCircle, Clock, Receipt, Building, Hash, AlertTriangle, Printer, RotateCcw
} from 'lucide-react'
import type { PaymentWithRelations } from '@/types/finance'
import PaymentReceipt from './PaymentReceipt'
import RefundPaymentDialog from './RefundPaymentDialog'

interface PaymentDetailDrawerProps {
  payment: PaymentWithRelations | null
  open: boolean
  onClose: () => void
}

const fmtCurrency = (v: number, c = 'ETB') =>
  `${c} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value?: string | React.ReactNode; mono?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!value) return null

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
          {mono && typeof value === 'string' && (
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const statusStyles: Record<string, { bg: string; text: string; icon: any }> = {
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', icon: CheckCircle },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-700', icon: Clock },
  failed: { bg: 'bg-red-500/10', text: 'text-red-700', icon: AlertTriangle },
  refunded: { bg: 'bg-purple-500/10', text: 'text-purple-700', icon: Receipt },
}

export default function PaymentDetailDrawer({ payment, open, onClose }: PaymentDetailDrawerProps) {
  const [showReceipt, setShowReceipt] = useState(false)
  const [showRefund, setShowRefund] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showReceipt && !showRefund) onClose() }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose, showReceipt, showRefund])

  const status = payment?.status || 'completed'
  const statusConfig = statusStyles[status] || statusStyles.completed
  const StatusIcon = statusConfig.icon

  return (
    <AnimatePresence>
      {open && payment && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Payment Details</h2>
                  <p className="text-xs text-muted-foreground font-mono">{payment.id.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status === 'completed' && (
                  <button
                    onClick={() => setShowRefund(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Refund
                  </button>
                )}
                <button
                  onClick={() => setShowReceipt(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-teal-600 bg-teal-500/10 hover:bg-teal-500/20 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Receipt
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Amount + Status */}
              <div className="text-center py-6 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/30">
                <p className="text-3xl font-bold text-foreground mb-2">
                  {fmtCurrency(payment.amount, payment.invoice_currency)}
                </p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span className="capitalize">{status}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment Information</h3>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-0 divide-y divide-border/20">
                  <InfoRow icon={Calendar} label="Payment Date" value={fmtDate(payment.payment_date)} />
                  <InfoRow icon={CreditCard} label="Payment Method" value={
                    <span className="capitalize">{(payment.payment_method || '').replace('_', ' ')}</span>
                  } />
                  <InfoRow icon={Hash} label="Reference Number" value={payment.reference_number} mono />
                  <InfoRow icon={Clock} label="Recorded At" value={fmtDate(payment.created_at)} />
                  <InfoRow icon={User} label="Recorded By" value={payment.recorded_by_name} />
                </div>
              </div>

              {/* Invoice Info */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Invoice</h3>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-0 divide-y divide-border/20">
                  <InfoRow icon={FileText} label="Invoice Number" value={payment.invoice_number} mono />
                  <InfoRow icon={DollarSign} label="Invoice Total" value={
                    payment.invoice_total ? fmtCurrency(payment.invoice_total, payment.invoice_currency) : undefined
                  } />
                  <InfoRow icon={DollarSign} label="Remaining Balance" value={
                    payment.remaining_amount !== undefined
                      ? payment.remaining_amount > 0
                        ? <span className="text-amber-600">{fmtCurrency(payment.remaining_amount, payment.invoice_currency)}</span>
                        : <span className="text-emerald-600">Fully Paid</span>
                      : undefined
                  } />
                  <InfoRow icon={Calendar} label="Due Date" value={payment.invoice_due_date ? fmtDate(payment.invoice_due_date) : undefined} />
                </div>
              </div>

              {/* Customer Info */}
              {payment.customer_name && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Customer</h3>
                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-0 divide-y divide-border/20">
                    <InfoRow icon={Building} label="Customer" value={payment.customer_name} />
                    <InfoRow icon={User} label="Email" value={payment.customer_email} />
                    <InfoRow icon={CreditCard} label="Phone" value={payment.customer_phone} />
                  </div>
                </div>
              )}

              {/* Booking Info */}
              {payment.booking_reference && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Booking</h3>
                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-0 divide-y divide-border/20">
                    <InfoRow icon={Hash} label="Booking Reference" value={payment.booking_reference} mono />
                    <InfoRow icon={MapPin} label="Destination" value={payment.booking_destination} />
                  </div>
                </div>
              )}

              {/* Notes */}
              {payment.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</h3>
                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                    <p className="text-sm text-foreground leading-relaxed">{payment.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <PaymentReceipt
            payment={payment}
            open={showReceipt}
            onClose={() => setShowReceipt(false)}
          />

          <RefundPaymentDialog
            payment={payment}
            open={showRefund}
            onClose={() => setShowRefund(false)}
            onSuccess={() => {
              setShowRefund(false)
              onClose()
              // In a real app we'd emit an event or call a prop to refresh data
              window.location.reload()
            }}
          />
        </>
      )}
    </AnimatePresence>
  )
}
