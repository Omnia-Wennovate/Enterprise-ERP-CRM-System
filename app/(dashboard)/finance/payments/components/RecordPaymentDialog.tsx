'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Calendar, CreditCard, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { recordPaymentAction, checkDuplicatePaymentAction, fetchCustomerOutstandingInvoices } from '@/app/actions/payments'
import type { PaymentMethod } from '@/types/finance'

interface RecordPaymentDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
]

export default function RecordPaymentDialog({ open, onClose, onSuccess }: RecordPaymentDialogProps) {
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  const [invoices, setInvoices] = useState<Array<{ id: string; invoice_number: string; remaining: number; currency: string }>>([])
  
  const [loading, setLoading] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [customerId, setCustomerId] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  
  // Duplicate check
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  const supabase = createClient()

  // Load customers on open
  useEffect(() => {
    if (open) {
      const loadCustomers = async () => {
        const { data } = await supabase.from('customers').select('id, company_name').order('company_name')
        setCustomers((data || []).map(c => ({ id: c.id, name: c.company_name || 'Unknown' })))
      }
      loadCustomers()
      
      // Reset form
      setCustomerId('')
      setInvoiceId('')
      setAmount('')
      setPaymentMethod('bank_transfer')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setReferenceNumber('')
      setNotes('')
      setError(null)
      setDuplicateWarning(null)
    }
  }, [open, supabase])

  // Load invoices when customer changes
  useEffect(() => {
    if (!customerId) {
      setInvoices([])
      setInvoiceId('')
      return
    }
    
    const loadInvoices = async () => {
      setLoadingInvoices(true)
      try {
        const data = await fetchCustomerOutstandingInvoices(customerId)
        setInvoices(data)
        if (data.length === 1) {
          setInvoiceId(data[0].id)
          setAmount(data[0].remaining.toString())
        } else {
          setInvoiceId('')
          setAmount('')
        }
      } catch (err) {
        console.error('Failed to load invoices', err)
      } finally {
        setLoadingInvoices(false)
      }
    }
    loadInvoices()
  }, [customerId])

  // Update amount when invoice selected
  useEffect(() => {
    if (invoiceId) {
      const inv = invoices.find(i => i.id === invoiceId)
      if (inv) setAmount(inv.remaining.toString())
    }
  }, [invoiceId, invoices])

  // Check for duplicates before submitting (debounced by user action, here we do it on blur or submit)
  const checkDuplicate = async () => {
    if (!customerId || !amount || !paymentMethod) return false
    
    try {
      const result = await checkDuplicatePaymentAction(customerId, Number(amount), paymentMethod)
      if (result.found) {
        setDuplicateWarning(`Warning: A similar payment of ${result.amount} via ${result.method?.replace('_', ' ')} was recorded ${result.hoursAgo} hours ago.`)
        return true
      }
    } catch (err) {
      console.error('Duplicate check failed', err)
    }
    setDuplicateWarning(null)
    return false
  }

  const handleSubmit = async (e: React.FormEvent, ignoreDuplicate = false) => {
    e.preventDefault()
    setError(null)
    
    if (!invoiceId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please select an invoice and enter a valid amount.')
      return
    }

    const selectedInv = invoices.find(i => i.id === invoiceId)
    if (selectedInv && Number(amount) > selectedInv.remaining + 0.01) {
      setError(`Amount cannot exceed the remaining balance of ${selectedInv.remaining}.`)
      return
    }

    setLoading(true)
    try {
      if (!ignoreDuplicate) {
        const hasDuplicate = await checkDuplicate()
        if (hasDuplicate) {
          setLoading(false)
          return // Stop and wait for user to confirm
        }
      }

      await recordPaymentAction({
        invoice_id: invoiceId,
        amount: Number(amount),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        reference_number: referenceNumber,
        notes: notes,
      })
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl shadow-xl w-full max-w-lg border border-border/50 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-omnia-gold/100/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-omnia-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Record Payment</h2>
                <p className="text-xs text-muted-foreground">Receive and apply a payment</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-2 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {duplicateWarning && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 font-medium">{duplicateWarning}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDuplicateWarning(null)} className="px-3 py-1.5 text-xs font-medium bg-white text-slate-700 rounded-lg border border-border">Cancel</button>
                  <button onClick={(e) => handleSubmit(e, true)} className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600">Proceed Anyway</button>
                </div>
              </div>
            )}

            {customerId && invoices.length === 0 && !loadingInvoices && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 font-medium">This customer has no outstanding invoices. A payment must be allocated to an existing invoice.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Customer</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-omnia-gold-500/30 outline-none text-sm"
                >
                  <option value="">Select a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center justify-between">
                  Invoice
                  {loadingInvoices && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                </label>
                <select
                  required
                  disabled={!customerId || invoices.length === 0}
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-omnia-gold-500/30 outline-none text-sm disabled:bg-muted/50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!customerId ? 'Select customer first' : invoices.length === 0 ? 'No outstanding invoices' : 'Select an invoice...'}
                  </option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} ({inv.currency} {inv.remaining.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-omnia-gold-500/30 outline-none text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-omnia-gold-500/30 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Method */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Method</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      required
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-omnia-gold-500/30 outline-none text-sm"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Reference No. <span className="text-muted-foreground font-normal">(Optional)</span></label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-omnia-gold-500/30 outline-none text-sm"
                      placeholder="Txn ID or Cheque No."
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes <span className="text-muted-foreground font-normal">(Optional)</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-omnia-gold-500/30 outline-none text-sm resize-none"
                  placeholder="Internal notes about this payment..."
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
                  disabled={loading || !!duplicateWarning || !invoiceId || !amount}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-omnia-gold/100 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-xl transition-colors shadow-lg shadow-teal-500/25 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
