// ============================================================================
// VISA MANAGEMENT SYSTEM — Type Definitions
// types/visa.ts
// ============================================================================

import { z } from 'zod'

// ── Status & Enum Types ──────────────────────────────────────────────────────

export type VisaStatus =
  | 'not_started'
  | 'documents_collecting'
  | 'documents_submitted'
  | 'submitted'
  | 'appointment_scheduled'
  | 'biometric_pending'
  | 'biometric_completed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'under_review'
  | 'additional_documents_requested'
  | 'approved'
  | 'rejected'
  | 'passport_returned'
  | 'completed'
  | 'expired'
  | 'cancelled'

export type VisaPriority = 'low' | 'normal' | 'high' | 'urgent'

export type VisaType =
  | 'tourist'
  | 'business'
  | 'work'
  | 'student'
  | 'transit'
  | 'medical'
  | 'conference'
  | 'family'
  | 'diplomatic'
  | 'other'

export type AppointmentType =
  | 'embassy_appointment'
  | 'vac_appointment'
  | 'interview'
  | 'biometric'
  | 'medical_examination'
  | 'document_submission'

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired'

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'overdue'

export type CommunicationType = 'comment' | 'internal_note' | 'customer_message' | 'email' | 'whatsapp' | 'phone_call'

export type VisaDocumentType =
  | 'passport'
  | 'photo'
  | 'bank_statement'
  | 'invitation_letter'
  | 'employment_letter'
  | 'flight_reservation'
  | 'hotel_reservation'
  | 'insurance'
  | 'birth_certificate'
  | 'marriage_certificate'
  | 'business_license'
  | 'company_registration'
  | 'tax_certificate'
  | 'passport_scan'
  | 'additional'

// ── Core Interfaces ──────────────────────────────────────────────────────────

export interface VisaApplication {
  id: string
  booking_id: string | null
  traveler_id: string | null
  destination_country: string
  visa_type: string
  status: VisaStatus
  priority: VisaPriority
  assigned_officer_id: string | null
  purpose_of_travel: string | null
  submission_date: string | null
  appointment_date: string | null
  biometric_date: string | null
  decision_date: string | null
  expected_decision_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields (from booking_travelers)
  traveler_first_name?: string
  traveler_last_name?: string
  traveler_email?: string
  traveler_phone?: string
  traveler_passport_number?: string
  traveler_passport_expiry?: string
  traveler_nationality?: string
  traveler_date_of_birth?: string
  // Joined fields (from bookings)
  booking_reference?: string
  booking_destination?: string
  booking_customer_name?: string
  booking_trip_start_date?: string
  booking_trip_end_date?: string
  // Joined fields (from profiles / officer)
  officer_name?: string
  officer_avatar_url?: string
}

export interface VisaApplicationWithRelations extends VisaApplication {
  documents: VisaDocument[]
  appointments: VisaAppointment[]
  timeline: VisaTimelineEvent[]
  communications: VisaCommunication[]
  fees: VisaFee | null
  country_rule: CountryVisaRule | null
}

export interface CountryVisaRule {
  id: string
  nationality: string
  destination_country: string
  visa_required: boolean
  processing_time_days: number | null
  embassy_name: string | null
  embassy_address: string | null
  embassy_phone: string | null
  embassy_email: string | null
  required_documents: string[]
  visa_fee: number | null
  visa_fee_currency: string
  biometric_required: boolean
  interview_required: boolean
  insurance_required: boolean
  min_passport_validity_months: number
  allowed_stay_days: number | null
  visa_validity_months: number | null
  entry_count: string
  additional_notes: string | null
  created_at: string
  updated_at: string
}

export interface VisaAppointment {
  id: string
  visa_application_id: string
  appointment_type: AppointmentType
  scheduled_datetime: string
  end_datetime: string | null
  location: string | null
  address: string | null
  contact_info: string | null
  status: AppointmentStatus
  notes: string | null
  reminder_sent: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface VisaFee {
  id: string
  visa_application_id: string
  government_fee: number
  agency_fee: number
  courier_fee: number
  service_fee: number
  insurance_fee: number
  vat: number
  discount: number
  total_amount: number
  payment_status: PaymentStatus
  payment_method: string | null
  payment_date: string | null
  invoice_number: string | null
  receipt_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VisaAuditLog {
  id: string
  visa_application_id: string | null
  action: string
  performed_by: string | null
  performed_by_name: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface VisaDocument {
  id: string
  visa_application_id: string
  document_type: VisaDocumentType
  file_name: string
  file_url: string | null
  file_size_kb: number | null
  upload_date: string
  verified_by: string | null
  verified_by_name: string | null
  verification_status: DocumentVerificationStatus
  verification_date: string | null
  expiry_date: string | null
  notes: string | null
  is_required: boolean
  created_at: string
}

export interface VisaTimelineEvent {
  id: string
  visa_application_id: string
  event_type: string
  title: string
  description: string | null
  performed_by: string | null
  performed_by_name: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface VisaCommunication {
  id: string
  visa_application_id: string
  message_type: CommunicationType
  content: string
  author_id: string | null
  author_name: string | null
  is_internal: boolean
  parent_id: string | null
  attachments: Array<{ name: string; url: string; size?: number }> | null
  created_at: string
  updated_at: string
  // For threaded replies
  replies?: VisaCommunication[]
}

// ── Dashboard & KPI Types ────────────────────────────────────────────────────

export interface VisaDashboardKPIs {
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  underReviewApplications: number
  expiredVisas: number
  visasExpiringSoon: number
  passportsExpiringSoon: number
  submittedToday: number
  averageProcessingDays: number
}

export interface VisaChartData {
  statusDistribution: Array<{ name: string; value: number; color: string }>
  monthlyApplications: Array<{ month: string; total: number; approved: number; rejected: number }>
  countryRequests: Array<{ country: string; count: number }>
  approvalRate: { approved: number; rejected: number; total: number }
  processingTimeTrend: Array<{ month: string; avgDays: number }>
}

// ── Search & Filter Types ────────────────────────────────────────────────────

export interface VisaSearchParams {
  query: string
  status: VisaStatus | ''
  priority: VisaPriority | ''
  visaType: VisaType | ''
  destination: string
  nationality: string
  assignedOfficer: string
  bookingRef: string
  dateFrom: string
  dateTo: string
}

export interface VisaFilterPreset {
  id: string
  name: string
  filters: Partial<VisaSearchParams>
  icon: string
  count?: number
}

// ── AI Assistant Types ───────────────────────────────────────────────────────

export interface VisaAIResponse {
  type: 'checklist' | 'probability' | 'summary' | 'suggestion' | 'passport_data' | 'rejection_reason'
  content: string
  confidence?: number
  suggestions?: string[]
  disclaimer: string
  isAIGenerated: true
}

export interface PassportExtractedData {
  fullName: string | null
  passportNumber: string | null
  nationality: string | null
  dateOfBirth: string | null
  issueDate: string | null
  expiryDate: string | null
  issuingCountry: string | null
  gender: string | null
  mrz: string | null
}

// ── Processing Time Intelligence (Section 21) ────────────────────────────────

export interface ProcessingTimeIntelligence {
  destination: string
  officialProcessingDays: number | null
  actualAverageDays: number
  sampleSize: number
  trend: 'faster' | 'stable' | 'slower'
  deviationPercent: number
  lastUpdated: string
}

// ── Form Validation Schemas ──────────────────────────────────────────────────

export const visaApplicationSchema = z.object({
  booking_id: z.string().optional().nullable(),
  traveler_id: z.string().optional().nullable(),
  destination_country: z.string().min(1, 'Destination country is required'),
  visa_type: z.string().min(1, 'Visa type is required'),
  status: z.string().default('not_started'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  assigned_officer_id: z.string().optional().nullable(),
  purpose_of_travel: z.string().optional().nullable(),
  submission_date: z.string().optional().nullable(),
  appointment_date: z.string().optional().nullable(),
  biometric_date: z.string().optional().nullable(),
  expected_decision_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const appointmentSchema = z.object({
  visa_application_id: z.string().min(1),
  appointment_type: z.string().min(1, 'Appointment type is required'),
  scheduled_datetime: z.string().min(1, 'Date and time is required'),
  end_datetime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contact_info: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const countryRuleSchema = z.object({
  nationality: z.string().min(1, 'Nationality is required'),
  destination_country: z.string().min(1, 'Destination is required'),
  visa_required: z.boolean().default(true),
  processing_time_days: z.number().optional().nullable(),
  embassy_name: z.string().optional().nullable(),
  embassy_address: z.string().optional().nullable(),
  embassy_phone: z.string().optional().nullable(),
  embassy_email: z.string().optional().nullable(),
  required_documents: z.array(z.string()).default([]),
  visa_fee: z.number().optional().nullable(),
  visa_fee_currency: z.string().default('USD'),
  biometric_required: z.boolean().default(false),
  interview_required: z.boolean().default(false),
  insurance_required: z.boolean().default(false),
  min_passport_validity_months: z.number().default(6),
  allowed_stay_days: z.number().optional().nullable(),
  visa_validity_months: z.number().optional().nullable(),
  entry_count: z.string().default('single'),
  additional_notes: z.string().optional().nullable(),
})

export const visaFeeSchema = z.object({
  visa_application_id: z.string().min(1),
  government_fee: z.number().min(0).default(0),
  agency_fee: z.number().min(0).default(0),
  courier_fee: z.number().min(0).default(0),
  service_fee: z.number().min(0).default(0),
  insurance_fee: z.number().min(0).default(0),
  vat: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  payment_status: z.string().default('pending'),
  payment_method: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// ── Utility Constants ────────────────────────────────────────────────────────

export const VISA_STATUS_CONFIG: Record<VisaStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  not_started: { label: 'Not Started', color: '#64748B', bgColor: '#F1F5F9', icon: 'Circle' },
  documents_collecting: { label: 'Collecting Docs', color: '#F59E0B', bgColor: '#FFFBEB', icon: 'FolderOpen' },
  documents_submitted: { label: 'Docs Submitted', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'FileCheck' },
  submitted: { label: 'Submitted', color: '#8B5CF6', bgColor: '#F5F3FF', icon: 'Send' },
  appointment_scheduled: { label: 'Appt Scheduled', color: '#06B6D4', bgColor: '#ECFEFF', icon: 'Calendar' },
  biometric_pending: { label: 'Biometric Pending', color: '#EC4899', bgColor: '#FDF2F8', icon: 'Fingerprint' },
  biometric_completed: { label: 'Biometric Done', color: '#14B8A6', bgColor: '#F0FDFA', icon: 'CheckCircle2' },
  interview_scheduled: { label: 'Interview Set', color: '#F97316', bgColor: '#FFF7ED', icon: 'Users' },
  interview_completed: { label: 'Interview Done', color: '#84CC16', bgColor: '#F7FEE7', icon: 'UserCheck' },
  under_review: { label: 'Under Review', color: '#6366F1', bgColor: '#EEF2FF', icon: 'Search' },
  additional_documents_requested: { label: 'Docs Requested', color: '#EF4444', bgColor: '#FEF2F2', icon: 'AlertTriangle' },
  approved: { label: 'Approved', color: '#10B981', bgColor: '#ECFDF5', icon: 'CheckCircle' },
  rejected: { label: 'Rejected', color: '#EF4444', bgColor: '#FEF2F2', icon: 'XCircle' },
  passport_returned: { label: 'Passport Returned', color: '#0EA5E9', bgColor: '#F0F9FF', icon: 'RotateCcw' },
  completed: { label: 'Completed', color: '#059669', bgColor: '#ECFDF5', icon: 'Award' },
  expired: { label: 'Expired', color: '#6B7280', bgColor: '#F9FAFB', icon: 'Clock' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', bgColor: '#F3F4F6', icon: 'Ban' },
}

export const VISA_PRIORITY_CONFIG: Record<VisaPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: '#64748B', bgColor: '#F1F5F9' },
  normal: { label: 'Normal', color: '#3B82F6', bgColor: '#EFF6FF' },
  high: { label: 'High', color: '#F59E0B', bgColor: '#FFFBEB' },
  urgent: { label: 'Urgent', color: '#EF4444', bgColor: '#FEF2F2' },
}

export const VISA_TYPE_CONFIG: Record<VisaType, { label: string; icon: string }> = {
  tourist: { label: 'Tourist', icon: 'Palmtree' },
  business: { label: 'Business', icon: 'Briefcase' },
  work: { label: 'Work', icon: 'Building2' },
  student: { label: 'Student', icon: 'GraduationCap' },
  transit: { label: 'Transit', icon: 'ArrowRightLeft' },
  medical: { label: 'Medical', icon: 'Stethoscope' },
  conference: { label: 'Conference', icon: 'Presentation' },
  family: { label: 'Family', icon: 'Heart' },
  diplomatic: { label: 'Diplomatic', icon: 'Shield' },
  other: { label: 'Other', icon: 'FileQuestion' },
}

export const DOCUMENT_TYPE_LABELS: Record<VisaDocumentType, string> = {
  passport: 'Passport Copy',
  photo: 'Passport Photo',
  bank_statement: 'Bank Statement',
  invitation_letter: 'Invitation Letter',
  employment_letter: 'Employment Letter',
  flight_reservation: 'Flight Reservation',
  hotel_reservation: 'Hotel Reservation',
  insurance: 'Travel Insurance',
  birth_certificate: 'Birth Certificate',
  marriage_certificate: 'Marriage Certificate',
  business_license: 'Business License',
  company_registration: 'Company Registration',
  tax_certificate: 'Tax Certificate',
  passport_scan: 'Passport Scan (Full)',
  additional: 'Additional Document',
}

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  embassy_appointment: 'Embassy Appointment',
  vac_appointment: 'VAC Appointment',
  interview: 'Interview',
  biometric: 'Biometric Appointment',
  medical_examination: 'Medical Examination',
  document_submission: 'Document Submission',
}
