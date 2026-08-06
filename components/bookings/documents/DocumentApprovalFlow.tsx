'use client'

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import type { DocumentApprovalStatus } from '@/types/documents'
import { DOCUMENT_STATUS_LABELS } from '@/types/documents'

export function DocumentApprovalFlow({
  currentStatus,
  onStatusChange,
  loading
}: {
  currentStatus: DocumentApprovalStatus
  onStatusChange: (status: DocumentApprovalStatus, reason?: string) => void
  loading?: boolean
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const steps = [
    { id: 'draft', label: 'Draft' },
    { id: 'pending_review', label: 'Pending Review' },
    { id: 'approved', label: 'Approved' }
  ]

  const currentIndex = steps.findIndex(s => s.id === currentStatus)

  if (currentStatus === 'archived') {
    return (
      <div className="p-4 bg-muted/50 border border-border rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span className="font-medium">This document is archived</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 bg-card border border-border rounded-xl shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4">Approval Workflow</h3>
      
      {/* Stepper */}
      <div className="flex items-center justify-between relative mb-6">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 z-0 transition-all duration-500"
          style={{ width: currentStatus === 'rejected' ? '50%' : `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step, idx) => {
          const isCompleted = currentStatus === 'rejected' ? idx < 1 : idx <= currentIndex
          const isCurrent = currentStatus === step.id
          const isRejected = currentStatus === 'rejected' && idx === 1
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-card transition-colors ${
                isRejected ? 'border-rose-500 text-rose-500' :
                isCompleted ? 'border-emerald-500 text-emerald-600' : 
                'border-border text-muted-foreground'
              }`}>
                {isRejected ? <XCircle className="w-5 h-5" /> :
                 isCompleted ? <CheckCircle2 className="w-5 h-5" /> : 
                 <span className="text-xs font-bold">{idx + 1}</span>}
              </div>
              <span className={`text-xs font-medium absolute -bottom-6 w-24 text-center -ml-12 left-1/2 ${
                isCurrent || isRejected ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {isRejected ? 'Rejected' : step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="mt-10 pt-4 border-t border-slate-100 flex gap-3">
        {currentStatus === 'draft' && (
          <button 
            disabled={loading}
            onClick={() => onStatusChange('pending_review')}
            className="flex-1 px-4 py-2 bg-indigo-600 text-primary-foreground rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Submit for Review
          </button>
        )}
        
        {currentStatus === 'pending_review' && !showRejectForm && (
          <>
            <button 
              disabled={loading}
              onClick={() => onStatusChange('approved')}
              className="flex-1 px-4 py-2 bg-emerald-600 text-primary-foreground rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button 
              disabled={loading}
              onClick={() => setShowRejectForm(true)}
              className="flex-1 px-4 py-2 bg-card border border-border text-slate-700 rounded-lg text-sm font-medium hover:bg-muted/50 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </>
        )}
        
        {currentStatus === 'rejected' && (
           <button 
             disabled={loading}
             onClick={() => onStatusChange('pending_review')}
             className="flex-1 px-4 py-2 bg-indigo-600 text-primary-foreground rounded-lg text-sm font-medium hover:bg-indigo-700"
           >
             Resubmit for Review
           </button>
        )}
      </div>

      {/* Reject Form */}
      {showRejectForm && (
        <div className="mt-4 p-4 bg-muted/50 border border-border rounded-lg">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Reason for rejection (Required)
          </label>
          <textarea 
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="w-full border-border rounded-lg text-sm mb-3 focus:ring-rose-500 focus:border-rose-500"
            rows={3}
            placeholder="Please specify why this document is being rejected so the user can correct it..."
          />
          <div className="flex justify-end gap-2">
            <button 
              disabled={loading}
              onClick={() => setShowRejectForm(false)}
              className="px-3 py-1.5 text-xs font-medium bg-card border border-border text-slate-700 rounded-lg hover:bg-muted/50"
            >
              Cancel
            </button>
            <button 
              disabled={loading || rejectReason.length < 10}
              onClick={() => {
                onStatusChange('rejected', rejectReason)
                setShowRejectForm(false)
              }}
              className="px-3 py-1.5 text-xs font-medium bg-rose-600 text-primary-foreground rounded-lg hover:bg-rose-700 disabled:opacity-50"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
