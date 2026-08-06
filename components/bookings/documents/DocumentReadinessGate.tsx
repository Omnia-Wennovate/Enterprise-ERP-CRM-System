'use client'

import React, { useState } from 'react'
import { AlertTriangle, X, ShieldAlert } from 'lucide-react'
import type { BookingReadinessResult, ReadinessCategoryStatus } from '@/types/documents'
import { DocumentReadinessScore } from './DocumentReadinessScore'

export function DocumentReadinessGate({
  isOpen,
  onClose,
  bookingId,
  targetStatus,
  readiness,
  onOverride,
  userRole
}: {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  targetStatus: string
  readiness: BookingReadinessResult
  onOverride: (reason: string) => void
  userRole: string
}) {
  const [reason, setReason] = useState('')
  const canOverride = userRole === 'admin' || userRole === 'super_admin'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sidebar/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-700">
            <div className="p-2 bg-rose-100 rounded-full">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Action Blocked: Travel Readiness Incomplete</h2>
              <p className="text-sm opacity-90">Cannot advance booking status to {targetStatus}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-400 hover:text-rose-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-muted/50">
          <div className="mb-6">
            <DocumentReadinessScore result={readiness} />
          </div>

          <div className="bg-card p-5 rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Missing Mandatory Documents
            </h3>
            <ul className="space-y-2">
              {readiness.missingDocuments.map(doc => (
                <li key={doc.documentType} className="flex items-center gap-3 text-sm text-slate-700 p-2 bg-muted/50 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {doc.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-card space-y-4">
          {canOverride ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Override Reason (Required)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why you are overriding this safety gate..."
                className="w-full text-sm border-border rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 min-h-[80px]"
              />
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-card border border-border rounded-lg hover:bg-muted/50">
                  Cancel
                </button>
                <button
                  onClick={() => onOverride(reason)}
                  disabled={reason.length < 10}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-rose-600 border border-transparent rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Override & Proceed Anyway
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Only Administrators or Operations Managers can override this safety gate.
              </p>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-card border border-border rounded-lg hover:bg-muted/50">
                Acknowledge
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
