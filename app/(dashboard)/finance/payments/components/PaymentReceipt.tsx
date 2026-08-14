'use client'

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, Download, CheckCircle2, Building, Building2 } from 'lucide-react'
import type { PaymentWithRelations } from '@/types/finance'

interface PaymentReceiptProps {
  payment: PaymentWithRelations | null
  open: boolean
  onClose: () => void
}

const fmtCurrency = (v: number, c = 'ETB') =>
  `${c} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

export default function PaymentReceipt({ payment, open, onClose }: PaymentReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!printRef.current) return
    const content = printRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${payment?.id || 'Payment'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; }
            .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .company-info h1 { margin: 0 0 4px 0; color: #0f172a; font-size: 24px; }
            .company-info p { margin: 0; color: #64748b; font-size: 14px; }
            .receipt-title { text-align: right; }
            .receipt-title h2 { margin: 0 0 4px 0; color: #0d9488; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
            .receipt-title p { margin: 0; color: #64748b; font-size: 14px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .info-block h3 { margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
            .info-block p { margin: 0 0 4px 0; font-size: 15px; font-weight: 500; }
            .info-block p.sub { color: #64748b; font-weight: normal; font-size: 14px; }
            .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 40px; }
            .amount-box h4 { margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-weight: 500; }
            .amount-box .amount { margin: 0; color: #0f172a; font-size: 36px; font-weight: 700; }
            .amount-box .status { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; color: #059669; font-weight: 600; font-size: 14px; background: #ecfdf5; padding: 6px 16px; border-radius: 20px; }
            table { w-full; border-collapse: collapse; margin-bottom: 40px; width: 100%; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 13px; text-transform: uppercase; }
            td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; }
            .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 13px; }
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${content}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
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
          className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl border border-border/50 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Controls */}
          <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-muted/20">
            <h2 className="text-lg font-bold text-foreground">Payment Receipt</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-500/10 hover:bg-teal-500/20 rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Receipt Area */}
          <div className="p-8 overflow-y-auto bg-white dark:bg-slate-950">
            {/* The printable content container */}
            <div ref={printRef} className="text-slate-900 dark:text-slate-100">
              
              <div className="flex justify-between items-start border-b-2 border-slate-100 dark:border-slate-800 pb-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-teal-600 dark:text-teal-500">
                    <Building2 className="w-8 h-8" />
                    <h1 className="text-2xl font-bold tracking-tight">OMNIA ERP</h1>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">123 Business Avenue, Suite 100</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Addis Ababa, Ethiopia</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">contact@omniaerp.com</p>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-slate-200 dark:text-slate-800 uppercase tracking-widest mb-2">Receipt</h2>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Receipt No: <span className="font-mono">{payment.id.split('-')[0].toUpperCase()}</span></p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Date: {fmtDate(payment.payment_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Received From</h3>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{payment.customer_name || 'Walk-in Customer'}</p>
                  {payment.customer_email && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{payment.customer_email}</p>}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Payment Info</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1"><span className="font-medium text-slate-800 dark:text-slate-200">Method:</span> <span className="capitalize">{(payment.payment_method || '').replace('_', ' ')}</span></p>
                  <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-800 dark:text-slate-200">Reference:</span> <span className="font-mono">{payment.reference_number || 'N/A'}</span></p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center mb-8">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Amount Received</h4>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                  {fmtCurrency(payment.amount, payment.invoice_currency)}
                </p>
                <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Payment Successful
                </div>
              </div>

              <div className="mb-12">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Applied To</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                      <th className="py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice No.</th>
                      <th className="py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Booking Ref</th>
                      <th className="py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-4 text-sm font-mono text-slate-800 dark:text-slate-300">{payment.invoice_number}</td>
                      <td className="py-4 text-sm font-mono text-slate-600 dark:text-slate-400">{payment.booking_reference || '—'}</td>
                      <td className="py-4 text-sm font-semibold text-slate-900 dark:text-white text-right">{fmtCurrency(payment.amount, payment.invoice_currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <p>Thank you for your business.</p>
                <p className="mt-1">Generated on {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} by {payment.recorded_by_name}</p>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
