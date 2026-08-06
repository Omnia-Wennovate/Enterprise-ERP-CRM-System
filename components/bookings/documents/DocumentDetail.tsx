'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Download, Share2, AlertTriangle, Eye, Shield, Trash2, Calendar, User } from 'lucide-react'
import type { Document } from '@/types/documents'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/types/documents'
import { DocumentApprovalFlow } from './DocumentApprovalFlow'
import { DocumentComments } from './DocumentComments'
import { DocumentVersionHistory } from './DocumentVersionHistory'
import { DocumentPreview } from './DocumentPreview'
import { getExpirationSeverity } from '@/lib/services/document-validation'
import { DocumentExpirationBadge } from './DocumentExpirationBadge'

export function DocumentDetail({ 
  document, 
  onClose,
  onUpdate
}: { 
  document: Document, 
  onClose: () => void,
  onUpdate?: () => void
}) {
  const [showPreview, setShowPreview] = useState(false)
  
  let severityObj
  if (document.expiry_date) {
    severityObj = getExpirationSeverity(document.expiry_date)
  }

  const handleStatusChange = async (status: any, reason?: string) => {
    try {
      const { advanceApprovalStatus } = await import('@/lib/services/document-approval')
      await advanceApprovalStatus(document.id, status, 'currentUserId', { rejectionReason: reason })
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error(err)
      alert('Failed to update status')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-sidebar/20 backdrop-blur-sm" onClick={onClose} />
      <AnimatePresence>
        <motion.div 
          key="modal"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-muted shadow-2xl border-l border-border flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-card border-b border-border flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">{document.document_name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {DOCUMENT_TYPE_LABELS[document.document_type]}
                  </span>
                  <span className="text-xs text-muted-foreground">v{document.version}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPreview(true)} className="p-2 text-muted-foreground hover:text-indigo-600 bg-card border border-border rounded-lg shadow-sm hover:border-indigo-200 transition-colors" title="Preview">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-indigo-600 bg-card border border-border rounded-lg shadow-sm hover:border-indigo-200 transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Alerts */}
            {document.legal_hold && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 shadow-sm">
                <Shield className="w-5 h-5 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Legal Hold Active</h4>
                  <p className="text-sm mt-1 opacity-90">This document is protected from auto-archiving due to an open refund or cancellation request.</p>
                </div>
              </div>
            )}
            
            {document.approval_status === 'rejected' && document.rejection_reason && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 shadow-sm">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Document Rejected</h4>
                  <p className="text-sm mt-1 opacity-90">{document.rejection_reason}</p>
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Uploaded Date</span>
                <span className="text-sm text-foreground font-medium">{new Date(document.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Uploaded By</span>
                <span className="text-sm text-foreground font-medium">{document.uploaded_by_name || 'Unknown User'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Booking</span>
                <span className="text-sm text-foreground font-medium">{document.booking_reference || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Traveler</span>
                <span className="text-sm text-foreground font-medium">{document.traveler_first_name ? `${document.traveler_first_name} ${document.traveler_last_name}` : '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Expiry Date</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground font-medium">{document.expiry_date || 'N/A'}</span>
                  {severityObj && <DocumentExpirationBadge severity={severityObj.severity} label={severityObj.label} />}
                </div>
              </div>
            </div>

            {/* Workflow */}
            <DocumentApprovalFlow 
              currentStatus={document.approval_status}
              onStatusChange={handleStatusChange}
            />
            
            {/* Versions */}
            <DocumentVersionHistory documentId={document.id} />

          </div>

          {/* Right Sidebar - Comments (in a real layout this might be side-by-side, but in slide-over we stack or use tabs. Let's add a fixed bottom section or just stack it) */}
          <div className="h-64 border-t border-border bg-card">
            <DocumentComments documentId={document.id} currentUserId="currentUserId" />
          </div>

        </motion.div>
      </AnimatePresence>

      {showPreview && (
        <DocumentPreview document={document} onClose={() => setShowPreview(false)} />
      )}
    </>
  )
}
