'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, CheckCircle2, Clock, XCircle, Search, BookOpen, AlertTriangle, Filter,
} from 'lucide-react'
import type { Document } from '@/types/documents'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/types/documents'
import { DocumentExpirationBadge } from './DocumentExpirationBadge'
import { PassportStatusBadge } from './PassportStatusBadge'
import { getExpirationSeverity, getPassportStatus, formatPassportRemaining, maskPassportNumber } from '@/lib/services/document-validation'

type PassportFilter = 'all' | 'passports' | 'expiring_soon' | 'expired' | 'valid'

export function DocumentsList({
  documents,
  onSelect,
}: {
  documents: Document[]
  onSelect: (doc: Document) => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PassportFilter>('all')

  const filtered = useMemo(() => {
    let list = documents

    // Type/status filter
    if (filter === 'passports') {
      list = list.filter(d => d.document_type === 'passport')
    } else if (filter === 'expiring_soon' || filter === 'expired' || filter === 'valid') {
      list = list.filter(d => {
        if (d.document_type !== 'passport' || !d.expiry_date) return false
        return getPassportStatus(d.expiry_date) === filter
      })
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(d => {
        const customerMatch = (d.customer_name || '').toLowerCase().includes(q)
        const bookingMatch = (d.booking_reference || '').toLowerCase().includes(q)
        const nameMatch = (d.document_name || '').toLowerCase().includes(q)
        const travelerMatch = (
          `${d.traveler_first_name || ''} ${d.traveler_last_name || ''}`.toLowerCase()
        ).includes(q)
        // Only search masked passport numbers (not expose full)
        const passportMatch = d.document_type === 'passport'
          ? ((d.ai_extracted_data?.passportNumber || d.traveler_passport || '') as string)
              .toLowerCase()
              .includes(q)
          : false
        return customerMatch || bookingMatch || nameMatch || travelerMatch || passportMatch
      })
    }

    return list
  }, [documents, filter, search])

  const tabCounts = useMemo(() => ({
    all: documents.length,
    passports: documents.filter(d => d.document_type === 'passport').length,
    expiring_soon: documents.filter(d => d.document_type === 'passport' && d.expiry_date && getPassportStatus(d.expiry_date) === 'expiring_soon').length,
    expired: documents.filter(d => d.document_type === 'passport' && d.expiry_date && getPassportStatus(d.expiry_date) === 'expired').length,
    valid: documents.filter(d => d.document_type === 'passport' && d.expiry_date && getPassportStatus(d.expiry_date) === 'valid').length,
  }), [documents])

  const TABS: { key: PassportFilter; label: string; color?: string }[] = [
    { key: 'all', label: 'All Documents' },
    { key: 'passports', label: 'Passports' },
    { key: 'expiring_soon', label: 'Expiring Soon', color: 'text-amber-700' },
    { key: 'expired', label: 'Expired', color: 'text-red-700' },
    { key: 'valid', label: 'Valid', color: 'text-emerald-700' },
  ]

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer, booking reference, traveler name..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 px-4 overflow-x-auto">
          {TABS.map(tab => {
            const count = tabCounts[tab.key]
            const isActive = filter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <span className={isActive ? '' : (tab.color || '')}>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No documents found</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {search ? 'Try a different search term.' : 'Upload a document to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(doc =>
            doc.document_type === 'passport' ? (
              <PassportCard key={doc.id} document={doc} onClick={() => onSelect(doc)} />
            ) : (
              <DocumentCard key={doc.id} document={doc} onClick={() => onSelect(doc)} />
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── Passport Card ─────────────────────────────────────────────────────────────

function PassportCard({ document, onClick }: { document: Document; onClick: () => void }) {
  const expiryDate = document.expiry_date
  const passportStatus = expiryDate ? getPassportStatus(expiryDate) : null
  const remaining = expiryDate ? formatPassportRemaining(expiryDate) : null

  const passportNumRaw =
    (document.ai_extracted_data?.passportNumber as string | undefined) ||
    document.traveler_passport ||
    null
  const passportNumMasked = passportNumRaw ? maskPassportNumber(passportNumRaw) : null

  const holderName =
    document.ai_extracted_data?.fullName ||
    (document.traveler_first_name
      ? `${document.traveler_first_name} ${document.traveler_last_name}`
      : document.customer_name || null)

  const borderColor =
    passportStatus === 'expired'
      ? 'border-red-200 border-l-red-500 border-l-4'
      : passportStatus === 'expiring_soon'
      ? 'border-amber-200 border-l-amber-500 border-l-4'
      : 'border-border border-l-emerald-500 border-l-4'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`bg-card rounded-xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full ${borderColor}`}
    >
      {/* Top */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#0A1221]/5 border border-[#0A1221]/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-[#0A1221]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {document.document_name}
          </h4>
          <p className="text-xs text-muted-foreground">Passport</p>
        </div>
        {passportStatus && <PassportStatusBadge status={passportStatus} size="sm" />}
      </div>

      {/* Details */}
      <div className="space-y-1.5 mt-auto">
        {holderName && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Holder</span>
            <span className="font-medium text-slate-700 truncate max-w-[60%]">{holderName}</span>
          </div>
        )}
        {passportNumMasked && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Passport No.</span>
            <span className="font-mono text-slate-700">{passportNumMasked}</span>
          </div>
        )}
        {expiryDate && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Expires</span>
            <span className="font-medium text-slate-700">
              {new Date(expiryDate).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        )}
        {remaining && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Remaining</span>
            <span
              className={`font-semibold ${
                passportStatus === 'expired'
                  ? 'text-red-700'
                  : passportStatus === 'expiring_soon'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {remaining}
            </span>
          </div>
        )}
        {document.booking_reference && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Booking</span>
            <span className="font-medium text-slate-700">{document.booking_reference}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Generic Document Card ─────────────────────────────────────────────────────

function DocumentCard({ document, onClick }: { document: Document; onClick: () => void }) {
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
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            document.file_type === 'pdf'
              ? 'bg-red-50 text-red-600'
              : document.file_type === 'image'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-muted text-muted-foreground'
          }`}
        >
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
            <span className="font-medium text-slate-700">
              {document.traveler_first_name} {document.traveler_last_name}
            </span>
          </div>
        )}

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isApproved
                ? 'bg-emerald-50 text-emerald-700'
                : isRejected
                ? 'bg-rose-50 text-rose-700'
                : document.approval_status === 'archived'
                ? 'bg-muted text-slate-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
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
