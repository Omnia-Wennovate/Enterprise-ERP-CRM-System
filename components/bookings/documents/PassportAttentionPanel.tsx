'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle, XCircle, Eye, Plane, Calendar, User, BookOpen,
} from 'lucide-react'
import type { Document } from '@/types/documents'
import { PassportStatusBadge } from './PassportStatusBadge'
import { getPassportStatus, formatPassportRemaining, maskPassportNumber } from '@/lib/services/document-validation'

interface PassportAttentionPanelProps {
  passports: Document[]
  onViewPassport: (doc: Document) => void
}

export function PassportAttentionPanel({
  passports,
  onViewPassport,
}: PassportAttentionPanelProps) {
  const alertPassports = passports.filter(p => {
    if (!p.expiry_date || p.approval_status === 'archived') return false
    const s = getPassportStatus(p.expiry_date)
    return s === 'expiring_soon' || s === 'expired'
  })

  if (alertPassports.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">All Passports Valid</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            No passports require attention at this time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-amber-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 text-sm">Passport Attention Required</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              {alertPassports.length} passport{alertPassports.length !== 1 ? 's' : ''} require Operations review
            </p>
          </div>
        </div>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold">
          {alertPassports.length}
        </span>
      </div>

      {/* Passport Alert Rows */}
      <div className="divide-y divide-border">
        {alertPassports.map((passport, idx) => {
          const status = getPassportStatus(passport.expiry_date!)
          const remaining = formatPassportRemaining(passport.expiry_date!)
          const isExpired = status === 'expired'

          const holderName =
            passport.traveler_first_name && passport.traveler_last_name
              ? `${passport.traveler_first_name} ${passport.traveler_last_name}`
              : passport.customer_name || 'Unknown Traveler'

          const passportNumRaw =
            passport.ai_extracted_data?.passportNumber ||
            passport.traveler_passport ||
            null
          const passportNumMasked = passportNumRaw
            ? maskPassportNumber(passportNumRaw)
            : null

          return (
            <motion.div
              key={passport.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 hover:bg-muted/30 transition-colors ${
                isExpired ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-amber-400'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isExpired
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-amber-50 border border-amber-100'
                  }`}
                >
                  {isExpired ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{holderName}</span>
                    <PassportStatusBadge status={status} size="sm" />
                  </div>

                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    {/* Expiry */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>
                        Expires:{' '}
                        <strong className={isExpired ? 'text-red-700' : 'text-amber-700'}>
                          {new Date(passport.expiry_date!).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </strong>
                      </span>
                    </div>

                    {/* Remaining */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span
                        className={`font-semibold ${
                          isExpired ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {remaining}
                      </span>
                    </div>

                    {/* Passport number (masked) */}
                    {passportNumMasked && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="font-mono">{passportNumMasked}</span>
                      </div>
                    )}

                    {/* Booking */}
                    {passport.booking_reference && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                        <span>{passport.booking_reference}</span>
                        {passport.booking_destination && (
                          <span className="flex items-center gap-1">
                            <Plane className="w-3 h-3" />
                            {passport.booking_destination}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* View button */}
                <button
                  onClick={() => onViewPassport(passport)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#0A1221] text-white rounded-lg hover:bg-[#1a2744] transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
