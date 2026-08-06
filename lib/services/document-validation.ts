// ============================================================================
// DOCUMENT VALIDATION SERVICE — Expiry, Validity, Completeness Checks
// lib/services/document-validation.ts
// ============================================================================

import type {
  Document,
  DocumentValidationResult,
  ValidationBadge,
  ExpirationWarning,
  ExpirationSeverity,
} from '@/types/documents'

// ── Expiration Severity Calculator ────────────────────────────────────────────

export function getExpirationSeverity(expiryDate: string): {
  severity: ExpirationSeverity
  daysLeft: number
  label: string
  color: string
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)

  if (daysLeft < 0) {
    return { severity: 'expired', daysLeft, label: `Expired ${Math.abs(daysLeft)}d ago`, color: 'red' }
  }
  if (daysLeft <= 30) {
    return { severity: 'critical', daysLeft, label: `${daysLeft}d left`, color: 'red' }
  }
  if (daysLeft <= 90) {
    return { severity: 'warning', daysLeft, label: `${daysLeft}d left`, color: 'amber' }
  }
  if (daysLeft <= 180) {
    return { severity: 'caution', daysLeft, label: `${daysLeft}d left`, color: 'yellow' }
  }
  return { severity: 'ok', daysLeft, label: `Valid ${daysLeft}d`, color: 'green' }
}

// ── Validate a Single Document ────────────────────────────────────────────────

export function validateDocument(doc: Document): DocumentValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const badges: ValidationBadge[] = []

  // ── Expiry Check ─────────────────────────────────────────────────────────
  if (doc.expiry_date) {
    const { severity, daysLeft, label } = getExpirationSeverity(doc.expiry_date)

    if (severity === 'expired') {
      errors.push(`Document expired ${Math.abs(daysLeft)} days ago`)
      badges.push({ label: `Expired ${Math.abs(daysLeft)}d ago`, type: 'error', detail: doc.expiry_date })
    } else if (severity === 'critical') {
      warnings.push(`Document expires in ${daysLeft} days — urgent renewal needed`)
      badges.push({ label: `${daysLeft}d left`, type: 'warning', detail: 'Urgent renewal required' })
    } else if (severity === 'warning') {
      warnings.push(`Document expires in ${daysLeft} days`)
      badges.push({ label: `${daysLeft}d left`, type: 'warning', detail: 'Consider renewal' })
    } else {
      badges.push({ label, type: 'success' })
    }

    // Passport-specific: must be valid for at least 6 months beyond travel date
    if (doc.document_type === 'passport' && daysLeft > 0 && daysLeft < 180) {
      warnings.push('Passport may not meet minimum validity requirements for some destinations (6 months)')
      badges.push({ label: 'Min validity risk', type: 'warning', detail: 'Many countries require 6+ months validity' })
    }
  } else {
    // No expiry date — only warn for types that should have one
    const typesRequiringExpiry = ['passport', 'visa', 'travel_insurance', 'national_id', 'vaccination_certificate']
    if (typesRequiringExpiry.includes(doc.document_type)) {
      warnings.push('No expiry date set for this document type')
      badges.push({ label: 'No expiry date', type: 'warning' })
    }
  }

  // ── File Check ──────────────────────────────────────────────────────────
  if (!doc.file_url) {
    errors.push('No file attached to this document')
    badges.push({ label: 'No file', type: 'error' })
  } else {
    badges.push({ label: 'File attached', type: 'success' })
  }

  // ── AI Confidence Check ─────────────────────────────────────────────────
  if (doc.ai_confidence === 'low') {
    warnings.push('AI extraction had low confidence — please verify document data manually')
    badges.push({ label: 'Low AI confidence', type: 'warning', detail: 'Manual review recommended' })
  } else if (doc.ai_confidence === 'high') {
    badges.push({ label: 'AI verified', type: 'info' })
  }

  // ── Legal Hold ──────────────────────────────────────────────────────────
  if (doc.legal_hold) {
    badges.push({ label: 'Legal Hold', type: 'warning', detail: 'Open refund or cancellation request' })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    badges,
  }
}

// ── Passport Minimum Validity Check ──────────────────────────────────────────

export function validatePassportForTravel(
  passportExpiry: string,
  travelDate: string,
  returnDate?: string
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []
  const expiry = new Date(passportExpiry)
  const travel = new Date(travelDate)
  const ret = returnDate ? new Date(returnDate) : travel

  const daysValidAfterReturn = Math.ceil((expiry.getTime() - ret.getTime()) / 86400000)

  if (expiry < travel) {
    return { valid: false, warnings: ['Passport expires before travel date'] }
  }

  if (daysValidAfterReturn < 180) {
    warnings.push(`Passport has only ${daysValidAfterReturn} days validity after return (many countries require 6+ months)`)
  }

  if (daysValidAfterReturn < 90) {
    warnings.push('Critical: Passport may be rejected at border — less than 3 months validity after return')
  }

  return { valid: expiry >= travel, warnings }
}

// ── Bulk Expiration Report ────────────────────────────────────────────────────

export function buildExpirationWarnings(docs: Document[]): ExpirationWarning[] {
  const today = new Date()
  const in180Days = new Date(Date.now() + 180 * 86400000)

  return docs
    .filter(d => d.expiry_date && d.approval_status !== 'archived')
    .map(d => {
      const expiry = new Date(d.expiry_date!)
      const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
      const { severity } = getExpirationSeverity(d.expiry_date!)
      return {
        documentId: d.id,
        documentName: d.document_name,
        documentType: d.document_type,
        expiryDate: d.expiry_date!,
        daysUntilExpiry: daysLeft,
        severity,
        bookingReference: d.booking_reference,
        travelerName: d.traveler_first_name
          ? `${d.traveler_first_name} ${d.traveler_last_name}`
          : undefined,
      }
    })
    .filter(w => w.daysUntilExpiry <= 180)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}
