// ============================================================================
// DOCUMENT MANAGEMENT SYSTEM — Type Definitions
// types/documents.ts
// ============================================================================

import { z } from 'zod'

// ── Status & Enum Types ──────────────────────────────────────────────────────

export type DocumentApprovalStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived'

export type DocumentType =
  | 'passport'
  | 'visa'
  | 'flight_ticket'
  | 'hotel_voucher'
  | 'travel_insurance'
  | 'national_id'
  | 'invitation_letter'
  | 'employment_letter'
  | 'bank_statement'
  | 'vaccination_certificate'
  | 'birth_certificate'
  | 'marriage_certificate'
  | 'driver_license'
  | 'invoice'
  | 'receipt'
  | 'contract'
  | 'internal'
  | 'other'

export type DocumentFileType = 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'other'

export type DocumentAIConfidence = 'high' | 'medium' | 'low' | 'unverified'

export type DocumentCommentType = 'comment' | 'internal_note' | 'approval_note' | 'rejection_note'

export type DocumentAccessAction =
  | 'view'
  | 'download'
  | 'print'
  | 'share'
  | 'replace'
  | 'approve'
  | 'reject'
  | 'archive'
  | 'upload'

export type ExpirationSeverity = 'expired' | 'critical' | 'warning' | 'caution' | 'ok'

// Passport-specific validity status (8-calendar-month threshold)
export type PassportStatus = 'valid' | 'expiring_soon' | 'expired'

// ── Document Labels ───────────────────────────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  visa: 'Visa',
  flight_ticket: 'Flight Ticket',
  hotel_voucher: 'Hotel Voucher',
  travel_insurance: 'Travel Insurance',
  national_id: 'National ID',
  invitation_letter: 'Invitation Letter',
  employment_letter: 'Employment Letter',
  bank_statement: 'Bank Statement',
  vaccination_certificate: 'Vaccination Certificate',
  birth_certificate: 'Birth Certificate',
  marriage_certificate: 'Marriage Certificate',
  driver_license: 'Driver License',
  invoice: 'Invoice',
  receipt: 'Receipt',
  contract: 'Contract',
  internal: 'Internal Document',
  other: 'Other',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentApprovalStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
}

export const MANDATORY_DOCUMENT_TYPES: DocumentType[] = [
  'passport',
  'visa',
  'flight_ticket',
  'travel_insurance',
  'hotel_voucher',
]

// ── Core Document Interface ───────────────────────────────────────────────────

export interface Document {
  id: string
  booking_id: string | null
  traveler_id: string | null
  folder: string
  file_name: string
  file_url: string
  file_size_kb: number | null
  file_type: DocumentFileType
  file_mime: string | null
  status: string // legacy field
  approval_status: DocumentApprovalStatus
  rejection_reason: string | null
  document_type: DocumentType
  document_name: string
  country: string | null
  expiry_date: string | null
  version: number
  uploaded_by: string | null
  updated_by: string | null
  notes: string | null
  shared_with: string[] | null
  download_count: number
  ai_extracted_data: AIExtractedDocumentData | null
  ai_confidence: DocumentAIConfidence
  legal_hold: boolean
  archive_after_date: string | null
  created_at: string
  updated_at: string
  // Joined fields
  traveler_first_name?: string
  traveler_last_name?: string
  traveler_passport?: string
  traveler_nationality?: string
  booking_reference?: string
  booking_destination?: string
  customer_name?: string
  uploaded_by_name?: string
  updated_by_name?: string
}

// ── Document Version ──────────────────────────────────────────────────────────

export interface DocumentVersion {
  id: string
  document_id: string
  file_url: string
  file_name: string | null
  file_size_kb: number | null
  version: number
  uploaded_by: string | null
  uploaded_by_name?: string
  reason_for_change: string | null
  previous_version_id: string | null
  created_at: string
}

// ── Document Comment ──────────────────────────────────────────────────────────

export interface DocumentComment {
  id: string
  document_id: string
  author_id: string | null
  author_name?: string
  content: string
  comment_type: DocumentCommentType
  mentions: string[] | null
  is_edited: boolean
  created_at: string
  updated_at: string
}

// ── Document Access Log ───────────────────────────────────────────────────────

export interface DocumentAccessLog {
  id: string
  document_id: string
  accessed_by: string | null
  accessed_by_name?: string
  action: DocumentAccessAction
  ip_address: string | null
  device_info: string | null
  booking_id: string | null
  notes: string | null
  accessed_at: string
}

// ── Booking Readiness Override ────────────────────────────────────────────────

export interface BookingReadinessOverride {
  id: string
  booking_id: string
  overridden_by: string | null
  overridden_by_name?: string
  target_status: string
  missing_documents: string[]
  reason: string
  created_at: string
}

// ── Document Reminder ─────────────────────────────────────────────────────────

export interface DocumentReminder {
  id: string
  booking_id: string
  document_type: string | null
  days_before: number
  due_fire_at: string
  fired_at: string | null
  sent_to: string[] | null
  escalated: boolean
  created_at: string
}

// ── AI Extracted Data ─────────────────────────────────────────────────────────

export interface AIExtractedDocumentData {
  documentType?: string
  detectedType?: DocumentType
  // Passport fields
  fullName?: string
  passportNumber?: string
  nationality?: string
  dateOfBirth?: string
  issueDate?: string
  expiryDate?: string
  issuingCountry?: string
  gender?: string
  mrz?: string
  // Visa fields
  visaNumber?: string
  visaType?: string
  entryType?: string
  validFrom?: string
  validUntil?: string
  entries?: string
  // General fields
  issuer?: string
  documentNumber?: string
  summary?: string
  // Quality flags
  qualityIssues?: string[]
  isDuplicate?: boolean
  missingFields?: string[]
  // Confidence per field
  fieldConfidence?: Record<string, number>
  overallConfidence?: number
}

export interface OCRFieldComparison {
  field: string
  label: string
  aiValue: string | null
  existingValue: string | null
  confidence: number // 0-100
  hasConflict: boolean
  isLowConfidence: boolean
  confirmed: boolean
  editedValue?: string
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

export interface DocumentDashboardKPIs {
  totalDocuments: number
  pendingDocuments: number
  approvedDocuments: number
  expiredDocuments: number
  expiringSoon: number          // within 30 days
  missingDocuments: number
  passportCount: number
  visaDocuments: number
  insuranceDocuments: number
  flightTickets: number
  hotelVouchers: number
  legalHoldCount: number
  // Passport-specific counts (8-month calendar threshold)
  passportValid: number
  passportExpiringSoon: number
  passportExpired: number
}

export interface PassportKPIs {
  total: number
  valid: number
  expiringSoon: number   // within 8 calendar months
  expired: number
}

export interface DocumentChartData {
  byCategory: { name: string; value: number; color: string }[]
  expirationTimeline: { month: string; expiring: number; expired: number }[]
  monthlyUploads: { month: string; uploads: number }[]
  byStatus: { name: string; value: number; color: string }[]
  byCountry: { country: string; count: number }[]
  approvalFlow: { status: string; count: number }[]
}

// ── Search Params ─────────────────────────────────────────────────────────────

export interface DocumentSearchParams {
  query?: string           // booking#, traveler, customer, passport#, visa#
  document_type?: DocumentType | 'all'
  approval_status?: DocumentApprovalStatus | 'all'
  country?: string
  booking_id?: string
  traveler_id?: string
  expiry_from?: string
  expiry_to?: string
  uploaded_from?: string
  uploaded_to?: string
  has_legal_hold?: boolean
  limit?: number
  offset?: number
}

// ── Readiness Score ───────────────────────────────────────────────────────────

export interface BookingReadinessResult {
  bookingId: string
  score: number // 0-100
  totalRequired: number
  totalPresent: number
  totalApproved: number
  missingDocuments: MissingDocument[]
  categoryBreakdown: ReadinessCategoryStatus[]
  isReadyForTravel: boolean
  color: 'green' | 'yellow' | 'red'
}

export interface MissingDocument {
  documentType: DocumentType
  label: string
  isMandatory: boolean
}

export interface ReadinessCategoryStatus {
  documentType: DocumentType
  label: string
  status: 'approved' | 'pending' | 'missing' | 'rejected'
  documentId?: string
  expiryDate?: string
  expirationSeverity?: ExpirationSeverity
}

// ── Expiration Warning ────────────────────────────────────────────────────────

export interface ExpirationWarning {
  documentId: string
  documentName: string
  documentType: DocumentType
  expiryDate: string
  daysUntilExpiry: number
  severity: ExpirationSeverity
  bookingReference?: string
  travelerName?: string
}

// ── Validation Result ─────────────────────────────────────────────────────────

export interface DocumentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  badges: ValidationBadge[]
}

export interface ValidationBadge {
  label: string
  type: 'success' | 'warning' | 'error' | 'info'
  detail?: string
}

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const DocumentUploadSchema = z.object({
  booking_id: z.string().uuid().optional(),
  traveler_id: z.string().uuid().optional(),
  document_type: z.enum([
    'passport','visa','flight_ticket','hotel_voucher','travel_insurance',
    'national_id','invitation_letter','employment_letter','bank_statement',
    'vaccination_certificate','birth_certificate','marriage_certificate',
    'driver_license','invoice','receipt','contract','internal','other'
  ]),
  document_name: z.string().min(1, 'Document name is required'),
  country: z.string().optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
  reason_for_change: z.string().optional(), // for replacements
})

export type DocumentUploadFormValues = z.infer<typeof DocumentUploadSchema>

export const DocumentCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  comment_type: z.enum(['comment','internal_note','approval_note','rejection_note']).default('comment'),
  mentions: z.array(z.string()).optional(),
})

export const DocumentRejectionSchema = z.object({
  rejection_reason: z.string().min(10, 'Please provide a detailed rejection reason (min 10 characters)'),
})

export const ReadinessOverrideSchema = z.object({
  reason: z.string().min(10, 'A reason is required for overriding the readiness gate'),
})
