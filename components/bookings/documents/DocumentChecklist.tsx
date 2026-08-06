'use client'

import React, { useState } from 'react'
import { CheckSquare, AlertCircle, RefreshCw, FileText } from 'lucide-react'
import type { BookingReadinessResult, MissingDocument } from '@/types/documents'

export function DocumentChecklist({
  readiness,
  onUploadMissing
}: {
  readiness: BookingReadinessResult | null
  onUploadMissing: (docType: string) => void
}) {
  if (!readiness) {
    return (
      <div className="flex items-center justify-center p-8 bg-card border border-border rounded-xl">
        <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    )
  }

  const { categoryBreakdown, isReadyForTravel, score } = readiness

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className={`p-4 border-b flex items-center justify-between ${
        isReadyForTravel ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
      }`}>
        <div className="flex items-center gap-3">
          {isReadyForTravel ? (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckSquare className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className={`font-semibold ${isReadyForTravel ? 'text-emerald-900' : 'text-amber-900'}`}>
              {isReadyForTravel ? 'Travel Ready' : 'Incomplete Checklist'}
            </h3>
            <p className={`text-sm ${isReadyForTravel ? 'text-emerald-700' : 'text-amber-700'}`}>
              {score}% of required documents are approved
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {categoryBreakdown.map((item, idx) => {
          const isApproved = item.status === 'approved'
          const isPending = item.status === 'pending'
          
          return (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                  isApproved ? 'bg-emerald-500 text-primary-foreground' : 
                  isPending ? 'bg-amber-100 text-amber-500 border border-amber-300' :
                  'bg-card border border-border'
                }`}>
                  {isApproved && <CheckSquare className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${isApproved ? 'text-foreground line-through opacity-70' : 'text-foreground'}`}>
                    {item.label}
                  </span>
                  {item.expirationSeverity && (
                     <span className={`text-[10px] uppercase font-bold tracking-wider ${
                       item.expirationSeverity === 'expired' ? 'text-red-600' :
                       item.expirationSeverity === 'critical' ? 'text-rose-600' :
                       item.expirationSeverity === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                     }`}>
                       {item.expirationSeverity}
                     </span>
                  )}
                </div>
              </div>
              
              {!isApproved && !isPending && (
                <button 
                  onClick={() => onUploadMissing(item.documentType)}
                  className="px-3 py-1.5 bg-card border border-border text-xs font-medium text-slate-700 rounded-lg hover:bg-muted/50 flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Upload
                </button>
              )}
              {isPending && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                  Pending Review
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
