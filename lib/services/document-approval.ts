'use server'

// ============================================================================
// DOCUMENT APPROVAL SERVICE — Workflow State Machine + Readiness Gate
// lib/services/document-approval.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type {
  DocumentApprovalStatus,
  BookingReadinessResult,
  ReadinessCategoryStatus,
  MissingDocument,
  DocumentType,
  MANDATORY_DOCUMENT_TYPES,
} from '@/types/documents'
import { DOCUMENT_TYPE_LABELS } from '@/types/documents'

// ── Approval State Machine ────────────────────────────────────────────────────
// Valid transitions: draft → pending_review → approved | rejected → archived

const VALID_TRANSITIONS: Record<DocumentApprovalStatus, DocumentApprovalStatus[]> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['approved', 'rejected', 'draft'],
  approved: ['archived'],
  rejected: ['pending_review', 'archived'],
  archived: [],
}

export async function advanceApprovalStatus(
  documentId: string,
  newStatus: DocumentApprovalStatus,
  userId: string,
  options?: { rejectionReason?: string; note?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current status
  const { data: doc, error: fetchErr } = await supabase
    .from('documents')
    .select('approval_status, document_name, booking_id')
    .eq('id', documentId)
    .single()

  if (fetchErr || !doc) return { success: false, error: 'Document not found' }

  const current = doc.approval_status as DocumentApprovalStatus
  const allowed = VALID_TRANSITIONS[current] || []

  if (!allowed.includes(newStatus)) {
    return { success: false, error: `Cannot transition from '${current}' to '${newStatus}'` }
  }

  const updates: any = {
    approval_status: newStatus,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }

  if (newStatus === 'rejected' && options?.rejectionReason) {
    updates.rejection_reason = options.rejectionReason
  }
  if (newStatus === 'approved') {
    updates.rejection_reason = null
  }

  const { error: updateErr } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)

  if (updateErr) return { success: false, error: updateErr.message }

  // Log access action
  await supabase.from('document_access_log').insert([{
    document_id: documentId,
    accessed_by: userId,
    action: newStatus === 'approved' ? 'approve' :
             newStatus === 'rejected' ? 'reject' :
             newStatus === 'archived' ? 'archive' : 'view',
    booking_id: doc.booking_id,
    notes: options?.rejectionReason || options?.note,
  }])

  // Add comment for rejection
  if (newStatus === 'rejected' && options?.rejectionReason) {
    await supabase.from('document_comments').insert([{
      document_id: documentId,
      author_id: userId,
      content: `❌ **Rejected:** ${options.rejectionReason}`,
      comment_type: 'rejection_note',
    }])
  }

  if (newStatus === 'approved' && options?.note) {
    await supabase.from('document_comments').insert([{
      document_id: documentId,
      author_id: userId,
      content: `✅ **Approved.** ${options.note}`,
      comment_type: 'approval_note',
    }])
  }

  return { success: true }
}

// ── Calculate Booking Readiness Score ─────────────────────────────────────────

export async function calculateBookingReadiness(bookingId: string): Promise<BookingReadinessResult> {
  const supabase = await createClient()

  // Get all approved documents for this booking
  const { data: docs } = await supabase
    .from('documents')
    .select('id, document_type, approval_status, expiry_date')
    .eq('booking_id', bookingId)
    .neq('approval_status', 'archived')

  const existingDocs = docs || []

  // Mandatory document types for every booking
  const mandatory: DocumentType[] = ['passport', 'visa', 'flight_ticket', 'travel_insurance', 'hotel_voucher']

  // Try to get visa-country-specific requirements
  const { data: booking } = await supabase
    .from('bookings')
    .select('destination, customer_name, booking_reference')
    .eq('id', bookingId)
    .single()

  const today = new Date()

  const categoryBreakdown: ReadinessCategoryStatus[] = mandatory.map(docType => {
    const matchingDocs = existingDocs.filter(d => d.document_type === docType)
    const approvedDoc = matchingDocs.find(d => d.approval_status === 'approved')
    const pendingDoc = matchingDocs.find(d => d.approval_status === 'pending_review' || d.approval_status === 'draft')

    let status: ReadinessCategoryStatus['status'] = 'missing'
    let expirationSeverity: ReadinessCategoryStatus['expirationSeverity'] = undefined

    if (approvedDoc) {
      status = 'approved'
      if (approvedDoc.expiry_date) {
        const expiry = new Date(approvedDoc.expiry_date)
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
        expirationSeverity = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'critical' : daysLeft <= 90 ? 'warning' : 'ok'
      }
    } else if (pendingDoc) {
      status = 'pending'
    } else if (matchingDocs.some(d => d.approval_status === 'rejected')) {
      status = 'rejected'
    }

    return {
      documentType: docType,
      label: DOCUMENT_TYPE_LABELS[docType],
      status,
      documentId: (approvedDoc || pendingDoc)?.id,
      expiryDate: (approvedDoc || pendingDoc)?.expiry_date || undefined,
      expirationSeverity,
    }
  })

  const approvedCount = categoryBreakdown.filter(c => c.status === 'approved').length
  const score = Math.round((approvedCount / mandatory.length) * 100)

  const missingDocuments: MissingDocument[] = categoryBreakdown
    .filter(c => c.status === 'missing' || c.status === 'rejected')
    .map(c => ({
      documentType: c.documentType,
      label: c.label,
      isMandatory: true,
    }))

  return {
    bookingId,
    score,
    totalRequired: mandatory.length,
    totalPresent: existingDocs.length,
    totalApproved: approvedCount,
    missingDocuments,
    categoryBreakdown,
    isReadyForTravel: score === 100 && categoryBreakdown.every(c => c.expirationSeverity !== 'expired'),
    color: score >= 90 ? 'green' : score >= 60 ? 'yellow' : 'red',
  }
}

// ── Booking Status Advance Gate ───────────────────────────────────────────────

export async function canAdvanceBookingStatus(
  bookingId: string,
  targetStatus: string
): Promise<{ allowed: boolean; readiness?: BookingReadinessResult }> {
  // Only gate the documents_ready transition
  if (targetStatus !== 'documents_ready') return { allowed: true }

  const readiness = await calculateBookingReadiness(bookingId)
  return {
    allowed: readiness.isReadyForTravel,
    readiness,
  }
}

export async function advanceBookingStatusWithGate(
  bookingId: string,
  targetStatus: string,
  userId: string,
  override?: { reason: string }
): Promise<{ success: boolean; blocked?: boolean; readiness?: BookingReadinessResult; error?: string }> {
  const supabase = await createClient()

  const gate = await canAdvanceBookingStatus(bookingId, targetStatus)

  if (!gate.allowed && !override) {
    return { success: false, blocked: true, readiness: gate.readiness }
  }

  // Log override if used
  if (!gate.allowed && override) {
    // Verify user has override permission (admin or super_admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return { success: false, error: 'Insufficient permissions to override readiness gate' }
    }

    await supabase.from('booking_readiness_overrides').insert([{
      booking_id: bookingId,
      overridden_by: userId,
      target_status: targetStatus,
      missing_documents: gate.readiness?.missingDocuments.map(d => d.label) || [],
      reason: override.reason,
    }])
  }

  // Advance the booking status
  const { error } = await supabase
    .from('bookings')
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return { success: false, error: error.message }

  // Log timeline event
  await supabase.from('booking_timeline_events').insert([{
    booking_id: bookingId,
    event_type: 'status_changed',
    description: `Status changed to ${targetStatus}${override ? ' (readiness gate overridden)' : ''}`,
    created_by: userId,
  }])

  return { success: true }
}

// ── Get Readiness Overrides Log ───────────────────────────────────────────────

export async function getReadinessOverrides(bookingId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('booking_readiness_overrides')
    .select(`
      *,
      profiles!booking_readiness_overrides_overridden_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  if (bookingId) query = query.eq('booking_id', bookingId)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch overrides: ${error.message}`)

  return (data || []).map(r => ({
    ...r,
    overridden_by_name: (r as any).profiles?.full_name,
  }))
}
