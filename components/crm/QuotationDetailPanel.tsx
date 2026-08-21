'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FileText, MapPin, Calendar, Users, DollarSign, Tag, Mail,
  Phone, Building2, User, StickyNote, Paperclip, Edit2, Trash2,
  Send, Download, Copy, CheckCircle2, ArrowRight, Loader2,
  ExternalLink, Receipt, Shield, Baby,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  deleteQuotation, duplicateQuotation, updateQuotationStatus,
  convertQuotationToBooking,
} from '@/lib/services/quotations'
import { generateQuotationPDF } from '@/lib/services/quotation-pdf'
import { sendQuotationEmail } from '@/lib/services/quotation-email'
import type { QuotationWithItems } from '@/types/quotation'
import {
  QUOTATION_STATUS_COLORS, QUOTATION_STATUS_LABELS, QUOTATION_STATUSES,
} from '@/types/quotation'

interface QuotationDetailPanelProps {
  quotation: QuotationWithItems
  onClose: () => void
  onEdit: (q: QuotationWithItems) => void
  onRefresh: () => void
}

const TABS = ['Overview', 'Items', 'Terms', 'Attachments'] as const
type Tab = (typeof TABS)[number]

export function QuotationDetailPanel({ quotation, onClose, onEdit, onRefresh }: QuotationDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency }).format(amount)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const statusCfg = QUOTATION_STATUS_COLORS[quotation.status]

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setIsDeleting(true)
    try {
      await deleteQuotation(quotation.id)
      onClose()
      onRefresh()
      showToast('Quotation deleted')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      await duplicateQuotation(quotation.id)
      onRefresh()
      showToast('Quotation duplicated!')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Duplicate failed', 'error')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      await sendQuotationEmail(quotation)
      onRefresh()
      showToast('Email client opened & status set to Sent')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Email failed', 'error')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleConvertToBooking = async () => {
    setIsConverting(true)
    try {
      const bookingId = await convertQuotationToBooking(quotation.id)
      onRefresh()
      onClose()
      showToast(`Booking created! ID: ${bookingId.slice(0, 8)}...`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Conversion failed', 'error')
    } finally {
      setIsConverting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true)
    try {
      await updateQuotationStatus(quotation.id, newStatus as typeof quotation.status)
      onRefresh()
      showToast(`Status updated to ${QUOTATION_STATUS_LABELS[newStatus as typeof quotation.status]}`)
    } catch {
      showToast('Status update failed', 'error')
    } finally {
      setStatusUpdating(false)
    }
  }

  const travelers = quotation.adults + quotation.children + quotation.infants

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-[420px] flex-shrink-0 bg-card border-l border-border flex flex-col h-full overflow-hidden"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-600 text-primary-foreground' : 'bg-red-600 text-primary-foreground'
            }`}>
            <CheckCircle2 className="w-4 h-4" />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-omnia-gold flex-shrink-0" />
            <span className="text-xs font-mono font-bold text-omnia-gold">{quotation.quote_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
              {QUOTATION_STATUS_LABELS[quotation.status]}
            </span>
          </div>
          <h3 className="font-bold text-foreground text-sm leading-tight truncate">{quotation.quote_title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{quotation.customer_name}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors ml-2 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-3 gap-0 border-b border-gray-100 flex-shrink-0">
        <div className="px-4 py-3 text-center border-r border-gray-100">
          <p className="text-xs text-muted-foreground">Grand Total</p>
          <p className="text-sm font-bold text-omnia-gold-dark">{formatCurrency(quotation.grand_total)}</p>
        </div>
        <div className="px-4 py-3 text-center border-r border-gray-100">
          <p className="text-xs text-muted-foreground">Travelers</p>
          <p className="text-sm font-bold text-foreground">{travelers}</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Valid Until</p>
          <p className="text-xs font-bold text-foreground">{formatDate(quotation.valid_until)}</p>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-100 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={() => onEdit(quotation)} className="gap-1.5 text-xs">
          <Edit2 className="w-3 h-3" /> Edit
        </Button>
        <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={isDuplicating} className="gap-1.5 text-xs">
          {isDuplicating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
          Duplicate
        </Button>
        <Button size="sm" variant="outline" onClick={handleSendEmail} disabled={isSendingEmail} className="gap-1.5 text-xs">
          {isSendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Send Email
        </Button>
        <Button size="sm" variant="outline" onClick={() => generateQuotationPDF(quotation)} className="gap-1.5 text-xs">
          <Download className="w-3 h-3" /> PDF
        </Button>
        {quotation.status === 'accepted' && (
          <Button size="sm" onClick={handleConvertToBooking} disabled={isConverting}
            className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-primary-foreground">
            {isConverting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
            Convert to Booking
          </Button>
        )}
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-1.5 text-xs ml-auto">
          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          {confirmDelete ? 'Confirm?' : 'Delete'}
        </Button>
      </div>

      {/* ── STATUS UPDATE ── */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground font-medium">Status:</span>
        <select
          value={quotation.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={statusUpdating}
          className="text-xs border border-border rounded-lg px-2 py-1 bg-card focus:border-omnia-gold/60 outline-none cursor-pointer flex-1">
          {QUOTATION_STATUSES.map((s) => (
            <option key={s} value={s}>{QUOTATION_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {statusUpdating && <Loader2 className="w-3 h-3 animate-spin text-omnia-gold" />}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs font-semibold py-2.5 transition-colors border-b-2 ${
              activeTab === tab ? 'text-omnia-gold border-omnia-gold' : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {activeTab === 'Overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-5">
              {/* Customer */}
              <section>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Customer</h4>
                <div className="bg-muted rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-sm font-semibold text-foreground">{quotation.customer_name}</span></div>
                  {quotation.company && <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-xs text-muted-foreground">{quotation.company}</span></div>}
                  {quotation.contact_person && <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-xs text-muted-foreground">{quotation.contact_person}</span></div>}
                  {quotation.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><a href={`mailto:${quotation.email}`} className="text-xs text-omnia-gold hover:underline">{quotation.email}</a></div>}
                  {quotation.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-xs text-muted-foreground">{quotation.phone}</span></div>}
                </div>
              </section>

              {/* Trip */}
              <section>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Trip</h4>
                <div className="bg-muted rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-omnia-gold flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-foreground">{quotation.destination}</p>{quotation.country && <p className="text-xs text-muted-foreground">{quotation.city ? `${quotation.city}, ` : ''}{quotation.country}</p>}</div></div>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{formatDate(quotation.departure_date)} → {formatDate(quotation.return_date)}</span></div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{quotation.adults} Adult{quotation.adults !== 1 ? 's' : ''}</span>
                    {quotation.children > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{quotation.children} Children</span>}
                    {quotation.infants > 0 && <span className="flex items-center gap-1"><Baby className="w-3 h-3" />{quotation.infants} Infants</span>}
                  </div>
                  {quotation.travel_type && <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground capitalize">{quotation.travel_type}</span></div>}
                </div>
              </section>

              {/* Pricing Summary */}
              <section>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Pricing</h4>
                <div className="bg-muted rounded-xl overflow-hidden">
                  <div className="px-3 py-2 flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span className="font-medium">{formatCurrency(quotation.subtotal)}</span></div>
                  <div className="px-3 py-2 flex justify-between text-xs text-muted-foreground"><span>Discount</span><span className="font-medium text-red-500">−{formatCurrency(quotation.discount_amount)}</span></div>
                  <div className="px-3 py-2 flex justify-between text-xs text-muted-foreground border-b border-border"><span>Tax</span><span className="font-medium">{formatCurrency(quotation.tax_amount)}</span></div>
                  <div className="px-3 py-3 flex justify-between bg-omnia-gold text-primary-foreground"><span className="text-xs font-bold">GRAND TOTAL</span><span className="text-sm font-bold">{formatCurrency(quotation.grand_total)}</span></div>
                </div>
              </section>

              {/* Timeline */}
              <section>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">History</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Created', date: quotation.created_at, color: 'bg-gray-400' },
                    quotation.sent_at ? { label: 'Sent', date: quotation.sent_at, color: 'bg-blue-400' } : null,
                    quotation.viewed_at ? { label: 'Viewed', date: quotation.viewed_at, color: 'bg-purple-400' } : null,
                    quotation.accepted_at ? { label: 'Accepted', date: quotation.accepted_at, color: 'bg-green-400' } : null,
                    quotation.rejected_at ? { label: 'Rejected', date: quotation.rejected_at, color: 'bg-red-400' } : null,
                  ].filter(Boolean).map((event) => (
                    <div key={event!.label} className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${event!.color}`} />
                      <span className="text-xs text-muted-foreground font-medium">{event!.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatDate(event!.date)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* ITEMS */}
          {activeTab === 'Items' && (
            <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
              {quotation.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No items added</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quotation.items.map((item, idx) => (
                    <div key={item.id ?? idx} className="bg-muted rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-omnia-gold-dark bg-omnia-gold/10 px-2 py-0.5 rounded-full">{item.service}</span>
                        <span className="text-sm font-bold text-foreground">{formatCurrency(item.total)}</span>
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground mb-1">{item.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Qty: <strong>{item.quantity}</strong></span>
                        <span>Price: <strong>{formatCurrency(item.unit_price)}</strong></span>
                        {item.discount > 0 && <span>Disc: <strong className="text-orange-600">{item.discount}%</strong></span>}
                        {item.tax_rate > 0 && <span>Tax: <strong>{item.tax_rate}%</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TERMS */}
          {activeTab === 'Terms' && (
            <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Quotation Date</p>
                  <p className="text-sm font-semibold text-foreground">{formatDate(quotation.quotation_date)}</p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
                  <p className="text-sm font-semibold text-foreground">{formatDate(quotation.valid_until)}</p>
                </div>
              </div>
              {quotation.payment_terms && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment Terms</h4>
                  <p className="text-sm text-foreground bg-muted rounded-xl p-3">{quotation.payment_terms}</p>
                </div>
              )}
              {quotation.cancellation_policy && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Cancellation Policy</h4>
                  <p className="text-sm text-foreground bg-muted rounded-xl p-3">{quotation.cancellation_policy}</p>
                </div>
              )}
              {quotation.notes && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
                  <p className="text-sm text-foreground bg-muted rounded-xl p-3">{quotation.notes}</p>
                </div>
              )}
              {quotation.internal_notes && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Internal Notes</h4>
                  <p className="text-sm text-foreground bg-yellow-50 border border-yellow-200 rounded-xl p-3">{quotation.internal_notes}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ATTACHMENTS */}
          {activeTab === 'Attachments' && (
            <motion.div key="attachments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
              {(!quotation.attachment_urls || quotation.attachment_urls.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No attachments</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quotation.attachment_urls.map((url, idx) => {
                    const filename = url.split('/').pop() ?? `File ${idx + 1}`
                    return (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-muted rounded-xl p-3 hover:bg-omnia-gold/10 hover:border-omnia-gold/20 border border-gray-100 transition-all group">
                        <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-omnia-gold" />
                        <span className="text-xs text-foreground flex-1 truncate">{filename}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-omnia-gold flex-shrink-0" />
                      </a>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CREATED BY ── */}
      {quotation.creator_name && (
        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-muted-foreground">Created by <strong className="text-muted-foreground">{quotation.creator_name}</strong> · {formatDate(quotation.created_at)}</p>
        </div>
      )}
    </motion.div>
  )
}
