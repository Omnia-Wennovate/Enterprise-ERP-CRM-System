'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, FileText, Clock, DollarSign, ChevronRight } from 'lucide-react'
import type { InvoiceWithRelations } from '@/lib/services/invoice-dashboard'
import { fetchInvoiceDetail, fetchPaymentsByInvoice } from '@/app/actions/invoices'
import type { InvoiceDetail, Payment } from '@/types/finance'

interface InvoiceDetailDrawerProps {
  invoice: InvoiceWithRelations | null
  onClose: () => void
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  partially_paid: 'bg-purple-100 text-purple-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const fmt = (n: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n)

type TabKey = 'overview' | 'items' | 'payments' | 'timeline'

export default function InvoiceDetailDrawer({ invoice, onClose }: InvoiceDetailDrawerProps) {
  const [tab, setTab] = useState<TabKey>('overview')
  const [detail, setDetail] = useState<InvoiceDetail | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!invoice) return
    setDetail(null); setPayments([]); setLoading(true); setTab('overview')
    Promise.all([
      fetchInvoiceDetail(invoice.id),
      fetchPaymentsByInvoice(invoice.id),
    ]).then(([d, p]) => {
      setDetail(d)
      setPayments(p)
    }).catch(console.error).finally(() => setLoading(false))
  }, [invoice?.id])

  const progress = invoice ? Math.min(100, ((invoice.paid_amount ?? 0) / (invoice.total_amount || 1)) * 100) : 0

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <FileText size={13}/> },
    { key: 'items', label: 'Line Items', icon: <ChevronRight size={13}/> },
    { key: 'payments', label: `Payments (${payments.length})`, icon: <DollarSign size={13}/> },
    { key: 'timeline', label: 'Timeline', icon: <Clock size={13}/> },
  ]

  return (
    <AnimatePresence>
      {invoice && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{invoice.invoice_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[invoice.status] || STATUS_STYLES.draft}`}>
                    {invoice.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {invoice.customer_name || invoice.customer_id}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground"/>
              </button>
            </div>

            {/* Amount summary */}
            <div className="px-6 py-4 bg-muted/20 border-b border-border">
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total</div>
                  <div className="text-lg font-bold text-foreground">{fmt(invoice.total_amount, invoice.currency)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Paid</div>
                  <div className="text-lg font-bold text-emerald-600">{fmt(invoice.paid_amount ?? 0, invoice.currency)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Remaining</div>
                  <div className={`text-lg font-bold ${(invoice.outstanding ?? 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {fmt(invoice.outstanding ?? 0, invoice.currency)}
                  </div>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{progress.toFixed(0)}% paid</span>
                <span>Due: {invoice.due_date}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-4">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-muted animate-pulse"/>
                  ))}
                </div>
              ) : (
                <>
                  {tab === 'overview' && (
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Issued Date', value: invoice.issued_date },
                          { label: 'Due Date', value: invoice.due_date },
                          { label: 'Currency', value: invoice.currency },
                          { label: 'Exchange Rate', value: `${invoice.exchange_rate}` },
                          { label: 'Subtotal', value: fmt(invoice.amount, invoice.currency) },
                          { label: 'Tax', value: fmt(invoice.tax, invoice.currency) },
                          { label: 'Discount', value: fmt(invoice.discount, invoice.currency) },
                          { label: 'Priority', value: invoice.priority || '—' },
                          { label: 'Approval', value: invoice.approval_status || '—' },
                          { label: 'Booking Ref', value: invoice.booking_reference || '—' },
                          { label: 'Recurring', value: invoice.is_recurring ? `Yes (${invoice.recurrence_frequency || 'set'})` : 'No' },
                          { label: 'Tags', value: invoice.tags?.join(', ') || '—' },
                        ].map(row => (
                          <div key={row.label} className="bg-muted/30 rounded-xl p-3 border border-border/50">
                            <div className="text-xs text-muted-foreground mb-1">{row.label}</div>
                            <div className="text-sm font-medium text-foreground">{row.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'items' && (
                    <div className="p-6">
                      {!detail?.line_items?.length ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">No line items</div>
                      ) : (
                        <div className="space-y-2">
                          {detail.line_items.map(item => (
                            <div key={item.id} className="flex items-start justify-between bg-muted/30 rounded-xl p-4 border border-border/50">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-foreground">{item.description}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Qty: {item.quantity} × {fmt(item.unit_price, invoice.currency)}
                                  {item.discount_percent && item.discount_percent > 0 ? ` · ${item.discount_percent}% disc.` : ''}
                                  {item.tax_percent && item.tax_percent > 0 ? ` · ${item.tax_percent}% tax` : ''}
                                </div>
                              </div>
                              <div className="text-sm font-bold text-foreground ml-4">{fmt(item.line_total, invoice.currency)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'payments' && (
                    <div className="p-6">
                      {payments.length === 0 ? (
                        <div className="text-center py-12">
                          <CreditCard size={32} className="text-muted-foreground mx-auto mb-3"/>
                          <p className="text-sm text-muted-foreground">No payments recorded</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {payments.map(p => (
                            <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-xl p-4 border border-border/50">
                              <div>
                                <div className="text-sm font-semibold text-foreground">{fmt(p.amount, invoice.currency)}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {p.payment_method} · {p.payment_date}
                                  {p.reference_number ? ` · Ref: ${p.reference_number}` : ''}
                                </div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${p.bank_reconciled ? 'bg-emerald-500' : 'bg-amber-400'}`}/>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'timeline' && (
                    <div className="p-6">
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-border"/>
                        <div className="space-y-5">
                          {[
                            { label: 'Invoice Created', date: invoice.created_at, color: 'bg-blue-500' },
                            { label: 'Status: ' + invoice.status.replace('_', ' '), date: invoice.updated_at, color: 'bg-teal-500' },
                            ...payments.map(p => ({ label: `Payment: ${fmt(p.amount, invoice.currency)}`, date: p.payment_date, color: 'bg-emerald-500' })),
                          ]
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((event, i) => (
                            <div key={i} className="flex items-start gap-4 pl-2">
                              <div className={`w-3 h-3 rounded-full ${event.color} border-2 border-background mt-1 flex-shrink-0 z-10`}/>
                              <div>
                                <div className="text-sm font-medium text-foreground">{event.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
