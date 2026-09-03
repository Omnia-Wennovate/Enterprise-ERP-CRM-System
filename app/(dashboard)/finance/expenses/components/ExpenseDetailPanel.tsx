'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Clock, XCircle, AlertTriangle, ChevronDown, Download, Eye, Trash2, Paperclip, CreditCard, Tag, Building, Calendar, DollarSign, FileText, User } from 'lucide-react'
import type { ExpenseWithRelations, ExpenseAttachment, ExpenseApproval } from '@/types/finance'
import { fetchExpenseApprovals, fetchExpenseAttachments, submitExpenseApprovalAction, deleteExpenseAttachmentAction, directApproveExpenseAction, directRejectExpenseAction } from '@/app/actions/finance'

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const statusColor = {
  pending:      'bg-amber-100 text-amber-700 border-amber-200',
  approved:     'bg-green-100 text-green-700 border-green-200',
  rejected:     'bg-red-100 text-red-700 border-red-200',
  returned:     'bg-orange-100 text-orange-700 border-orange-200',
  not_required: 'bg-slate-100 text-slate-600 border-slate-200',
}

const statusIcon = { pending: <Clock size={12}/>, approved: <CheckCircle size={12}/>, rejected: <XCircle size={12}/>, returned: <AlertTriangle size={12}/>, not_required: <CheckCircle size={12}/> }

interface ExpenseDetailPanelProps {
  expense: ExpenseWithRelations | null
  onClose: () => void
  onRefresh: () => void
}

export function ExpenseDetailPanel({ expense, onClose, onRefresh }: ExpenseDetailPanelProps) {
  const [approvals, setApprovals] = useState<ExpenseApproval[]>([])
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([])
  const [approveId, setApproveId] = useState<string|null>(null)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'details'|'attachments'|'approvals'>('details')

  // Direct Finance Controls
  const [isDirectRejectOpen, setIsDirectRejectOpen] = useState(false)
  const [directRejectReason, setDirectRejectReason] = useState('')

  const handleDirectApprove = async () => {
    if (!expense) return
    if (!confirm('Are you sure you want to approve this expense immediately?')) return
    setSubmitting(true)
    try {
      await directApproveExpenseAction(expense.id)
      onRefresh()
      onClose()
    } catch (e) { alert(`Failed: ${e instanceof Error ? e.message : 'Error'}`) }
    finally { setSubmitting(false) }
  }

  const handleDirectReject = async () => {
    if (!expense) return
    if (!directRejectReason.trim()) return alert('Rejection reason is required.')
    setSubmitting(true)
    try {
      await directRejectExpenseAction(expense.id, directRejectReason)
      setIsDirectRejectOpen(false)
      onRefresh()
      onClose()
    } catch (e) { alert(`Failed: ${e instanceof Error ? e.message : 'Error'}`) }
    finally { setSubmitting(false) }
  }

  useEffect(() => {
    if (!expense) return
    fetchExpenseApprovals(expense.id).then(setApprovals).catch(()=>{})
    fetchExpenseAttachments(expense.id).then(setAttachments).catch(()=>{})
  }, [expense?.id])

  const handleApproval = async (approvalId: string, status: 'approved'|'rejected'|'returned') => {
    if (!expense) return
    setSubmitting(true)
    try {
      await submitExpenseApprovalAction(approvalId, expense.id, status, comments)
      setApproveId(null)
      setComments('')
      const [upd, att] = await Promise.all([fetchExpenseApprovals(expense.id), fetchExpenseAttachments(expense.id)])
      setApprovals(upd)
      setAttachments(att)
      onRefresh()
    } catch (e) { alert(`Failed: ${e instanceof Error ? e.message : 'Error'}`) }
    finally { setSubmitting(false) }
  }

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm('Delete this attachment?')) return
    try {
      await deleteExpenseAttachmentAction(id)
      setAttachments(prev => prev.filter(a => a.id !== id))
    } catch (e) { alert(`Failed: ${e instanceof Error ? e.message : 'Error'}`) }
  }

  if (!expense) return null

  const tabs = ['details','attachments','approvals'] as const

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40" onClick={onClose}/>
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-white/70 text-xs font-medium">Expense Detail</p>
              <h2 className="text-white font-bold text-lg">{expense.expense_number ?? 'EXP-???'}</h2>
              <p className="text-white/70 text-sm">{expense.description}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 text-white"><X size={18}/></button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border bg-muted/20 flex-shrink-0">
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-5 py-3 text-xs font-semibold capitalize border-b-2 transition-colors ${activeTab === t ? 'border-omnia-gold text-omnia-gold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                {t} {t==='attachments' && `(${attachments.length})`} {t==='approvals' && `(${approvals.length})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Details tab */}
            {activeTab === 'details' && (
              <div className="p-6 space-y-5">
                {/* Amount hero */}
                <div className="bg-gradient-to-br from-omnia-gold/10 to-omnia-gold/5 rounded-xl p-5 border border-omnia-gold/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-3xl font-bold text-omnia-gold-dark">{fmt(expense.amount, expense.currency ?? 'USD')}</p>
                      {expense.original_currency && expense.original_amount && (
                        <p className="text-xs text-omnia-gold mt-1">Originally {expense.original_amount} {expense.original_currency}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusColor[expense.approval_status as keyof typeof statusColor] ?? statusColor.pending}`}>
                        {statusIcon[expense.approval_status as keyof typeof statusIcon] ?? statusIcon.pending}
                        {expense.approval_status ?? 'pending'}
                      </span>
                      <br/>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColor[expense.status as keyof typeof statusColor] ?? statusColor.pending}`}>
                        {expense.status ?? 'unpaid'}
                      </span>
                    </div>
                  </div>
                  {expense.policy_exceeded && (
                    <div className="mt-3 flex items-center gap-1 text-amber-600 text-xs font-medium">
                      <AlertTriangle size={12}/> Exceeds policy limit — requires explicit approval
                    </div>
                  )}

                  {/* Direct Finance Actions */}
                  {expense.approval_status === 'pending' && (
                    <div className="mt-5 flex items-center gap-3 pt-5 border-t border-omnia-gold/15">
                      <button onClick={handleDirectApprove} disabled={submitting}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50">
                        {submitting ? '...' : '✓ Approve Expense'}
                      </button>
                      <button onClick={() => setIsDirectRejectOpen(true)} disabled={submitting}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50">
                        ✗ Reject Expense
                      </button>
                    </div>
                  )}
                </div>

                {/* Info grid */}
                {[
                  { icon: <Calendar size={14}/>, label: 'Date', value: fmtDate(expense.expense_date) },
                  { icon: <Tag size={14}/>, label: 'Category', value: expense.category },
                  { icon: <User size={14}/>, label: 'Employee', value: expense.employee_name ?? '-' },
                  { icon: <Building size={14}/>, label: 'Department', value: expense.department ?? '-' },
                  { icon: <Building size={14}/>, label: 'Project', value: expense.project ?? '-' },
                  { icon: <FileText size={14}/>, label: 'Vendor', value: expense.vendor_name ?? '-' },
                  { icon: <FileText size={14}/>, label: 'Booking', value: expense.booking_reference ?? '-' },
                  { icon: <DollarSign size={14}/>, label: 'Tax', value: fmt(expense.tax ?? 0, expense.currency ?? 'USD') },
                  { icon: <CreditCard size={14}/>, label: 'Payment Method', value: expense.payment_method?.replace('_',' ') ?? '-' },
                  { icon: <FileText size={14}/>, label: 'Reference', value: expense.payment_reference ?? '-' },
                  { icon: <FileText size={14}/>, label: 'Notes', value: expense.notes ?? '-' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">{row.icon}{row.label}</div>
                    <span className="text-sm font-semibold text-foreground text-right max-w-[200px] truncate">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Attachments tab */}
            {activeTab === 'attachments' && (
              <div className="p-6 space-y-3">
                {attachments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Paperclip size={32} className="mx-auto mb-2 opacity-30"/>
                    <p className="text-sm">No attachments</p>
                  </div>
                ) : attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                      {att.file_type?.startsWith('image/') ? (
                        <img src={att.file_url} alt={att.file_name} className="w-full h-full object-cover" />
                      ) : (
                        '📄'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{att.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {att.file_size ? `${(att.file_size/1024).toFixed(0)} KB · ` : ''}
                        {att.created_at ? fmtDate(att.created_at) : ''}
                        {att.uploaded_by_name ? ` · ${att.uploaded_by_name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-omnia-gold/10 text-omnia-gold transition-colors" title="Preview">
                        <Eye size={14}/>
                      </a>
                      <a href={att.file_url} download={att.file_name}
                        className="p-1.5 rounded hover:bg-omnia-gold/5 text-omnia-gold transition-colors" title="Download">
                        <Download size={14}/>
                      </a>
                      <button onClick={()=>handleDeleteAttachment(att.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors" title="Delete">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approvals tab */}
            {activeTab === 'approvals' && (
              <div className="p-6 space-y-3">
                {approvals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock size={32} className="mx-auto mb-2 opacity-30"/>
                    <p className="text-sm">No approval steps</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border"/>
                    <div className="space-y-4">
                      {approvals.map((ap) => {
                        const st = ap.status as keyof typeof statusColor
                        return (
                          <div key={ap.id} className="flex gap-4 relative">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${
                              ap.status==='approved' ? 'bg-green-100 border-green-400' :
                              ap.status==='rejected' ? 'bg-red-100 border-red-400' :
                              ap.status==='returned' ? 'bg-orange-100 border-orange-400' :
                              'bg-card border-border'
                            }`}>
                              {statusIcon[st] ?? statusIcon.pending}
                            </div>
                            <div className="flex-1 pb-1">
                              <div className="bg-card border border-border rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold text-sm text-foreground">Step {ap.step}: {ap.approver_role}</p>
                                    {ap.approver_name && <p className="text-xs text-muted-foreground">{ap.approver_name}</p>}
                                    {ap.comments && <p className="text-xs text-foreground mt-1 italic">"{ap.comments}"</p>}
                                    {ap.approved_at && <p className="text-xs text-muted-foreground mt-1">{fmtDate(ap.approved_at)}</p>}
                                  </div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor[st] ?? statusColor.pending}`}>
                                    {statusIcon[st]}{ap.status}
                                  </span>
                                </div>

                                {/* Action buttons for pending */}
                                {ap.status === 'pending' && (
                                  <div className="mt-3">
                                    {approveId === ap.id ? (
                                      <div className="space-y-2">
                                        <textarea value={comments} onChange={e=>setComments(e.target.value)} placeholder="Comments (optional)" rows={2}
                                          className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground resize-none outline-none focus:ring-2 focus:ring-omnia-gold-500"/>
                                        <div className="flex gap-2">
                                          <button onClick={()=>handleApproval(ap.id,'approved')} disabled={submitting}
                                            className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                                            {submitting?'...':'✓ Approve'}
                                          </button>
                                          <button onClick={()=>handleApproval(ap.id,'rejected')} disabled={submitting}
                                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                                            {submitting?'...':'✗ Reject'}
                                          </button>
                                          <button onClick={()=>handleApproval(ap.id,'returned')} disabled={submitting}
                                            className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                                            {submitting?'...':'↩ Return'}
                                          </button>
                                          <button onClick={()=>setApproveId(null)} className="px-3 py-1.5 border border-border text-xs rounded-lg hover:bg-muted"><X size={12}/></button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button onClick={()=>setApproveId(ap.id)}
                                        className="flex items-center gap-1 text-xs font-medium text-omnia-gold hover:text-omnia-gold-dark mt-1">
                                        <ChevronDown size={12}/> Take action
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Reject Dialog */}
      <AnimatePresence>
        {isDirectRejectOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setIsDirectRejectOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-card rounded-2xl shadow-2xl p-6 border border-border">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-2"><XCircle size={20}/> Reject Expense</h3>
              <p className="text-sm text-muted-foreground mb-4">Please provide a reason for rejecting this expense. This will be sent to the employee.</p>
              <textarea 
                value={directRejectReason} onChange={(e) => setDirectRejectReason(e.target.value)}
                placeholder="Rejection reason..." rows={4}
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-sm resize-none focus:ring-2 focus:ring-red-500 outline-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setIsDirectRejectOpen(false)} disabled={submitting} className="flex-1 py-2 rounded-xl text-sm font-semibold border hover:bg-muted text-foreground">Cancel</button>
                <button onClick={handleDirectReject} disabled={submitting || !directRejectReason.trim()} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
                  {submitting ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
