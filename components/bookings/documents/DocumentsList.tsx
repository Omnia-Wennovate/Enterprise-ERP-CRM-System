'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, MoreVertical, Download, Eye, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { Document } from '@/types/documents'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/types/documents'
import { DocumentExpirationBadge } from './DocumentExpirationBadge'
import { getExpirationSeverity } from '@/lib/services/document-validation'

export function DocumentsList({ 
  documents,
  onSelect
}: { 
  documents: Document[],
  onSelect: (doc: Document) => void
}) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-xl border border-border">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground">No documents found</h3>
        <p className="text-muted-foreground mt-1">Upload a document to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {documents.map(doc => (
        <DocumentCard key={doc.id} document={doc} onClick={() => onSelect(doc)} />
      ))}
    </div>
  )
}

function DocumentCard({ document, onClick }: { document: Document, onClick: () => void }) {
  const isApproved = document.approval_status === 'approved'
  const isRejected = document.approval_status === 'rejected'
  
  let severityObj
  if (document.expiry_date) {
    severityObj = getExpirationSeverity(document.expiry_date)
  }

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
    >
      {document.legal_hold && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="bg-amber-500 text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 w-[150%] text-center transform rotate-45 translate-x-3 -translate-y-2 shadow-sm">
            Hold
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          document.file_type === 'pdf' ? 'bg-red-50 text-red-600' :
          document.file_type === 'image' ? 'bg-omnia-gold/5 text-omnia-gold' :
          'bg-muted text-muted-foreground'
        }`}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="text-sm font-semibold text-foreground truncate">{document.document_name}</h4>
          <p className="text-xs text-muted-foreground truncate">{DOCUMENT_TYPE_LABELS[document.document_type]}</p>
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        {document.booking_reference && (
           <div className="flex justify-between items-center text-xs">
             <span className="text-muted-foreground">Booking:</span>
             <span className="font-medium text-slate-700">{document.booking_reference}</span>
           </div>
        )}
        {document.traveler_first_name && (
           <div className="flex justify-between items-center text-xs">
             <span className="text-muted-foreground">Traveler:</span>
             <span className="font-medium text-slate-700">{document.traveler_first_name} {document.traveler_last_name}</span>
           </div>
        )}
        
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
           <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
             isApproved ? 'bg-emerald-50 text-emerald-700' :
             isRejected ? 'bg-rose-50 text-rose-700' :
             document.approval_status === 'archived' ? 'bg-muted text-slate-700' :
             'bg-amber-50 text-amber-700'
           }`}>
             {isApproved && <CheckCircle2 className="w-3 h-3" />}
             {isRejected && <XCircle className="w-3 h-3" />}
             {!isApproved && !isRejected && <Clock className="w-3 h-3" />}
             {DOCUMENT_STATUS_LABELS[document.approval_status]}
           </span>
           
           {severityObj && (
             <DocumentExpirationBadge severity={severityObj.severity} label={severityObj.label} />
           )}
        </div>
      </div>
    </motion.div>
  )
}
