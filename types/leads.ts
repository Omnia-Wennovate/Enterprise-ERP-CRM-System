import { z } from 'zod'

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const LEAD_SOURCES = [
  'website',
  'walk_in',
  'referral',
  'facebook',
  'instagram',
  'linkedin',
  'whatsapp',
  'email_campaign',
  'cold_call',
  'existing_customer',
  'event',
  'other',
] as const

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Website',
  walk_in: 'Walk In',
  referral: 'Referral',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  email_campaign: 'Email Campaign',
  cold_call: 'Cold Call',
  existing_customer: 'Existing Customer',
  event: 'Event',
  other: 'Other',
}

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Hospitality',
  'Real Estate',
  'Government',
  'Non-Profit',
  'Media',
  'Transportation',
  'Energy',
  'Other',
] as const

export const PIPELINE_STAGES = [
  'new',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const

export const PIPELINE_STAGE_LABELS: Record<LeadPipelineStage, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export const PIPELINE_STAGE_COLORS: Record<LeadPipelineStage, { text: string; bg: string }> = {
  new: { text: 'text-gray-700', bg: 'bg-gray-100' },
  qualified: { text: 'text-blue-700', bg: 'bg-blue-100' },
  proposal: { text: 'text-purple-700', bg: 'bg-purple-100' },
  negotiation: { text: 'text-orange-700', bg: 'bg-orange-100' },
  won: { text: 'text-green-700', bg: 'bg-green-100' },
  lost: { text: 'text-red-700', bg: 'bg-red-100' },
}

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const PRIORITY_COLORS: Record<LeadPriority, { text: string; bg: string }> = {
  low: { text: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { text: 'text-blue-600', bg: 'bg-blue-100' },
  high: { text: 'text-orange-600', bg: 'bg-orange-100' },
  critical: { text: 'text-red-600', bg: 'bg-red-100' },
}

export const TRAVEL_TYPES = [
  'leisure',
  'business',
  'group',
  'corporate',
  'educational',
  'medical',
  'religious',
  'vip',
] as const

export const TRAVEL_TYPE_LABELS: Record<TravelType, string> = {
  leisure: 'Leisure',
  business: 'Business',
  group: 'Group',
  corporate: 'Corporate',
  educational: 'Educational',
  medical: 'Medical',
  religious: 'Religious',
  vip: 'VIP',
}

export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR',
  'ETB',
  'KES',
  'EGP',
  'INR',
  'CNY',
] as const

export const LEAD_TAGS = [
  'VIP',
  'Corporate',
  'Repeat Customer',
  'Urgent',
  'Referral',
  'Website',
  'Cold Call',
  'International',
  'Domestic',
] as const

export const LEAD_STATUSES = ['active', 'inactive'] as const

export const ACTIVITY_TYPES = [
  'lead_created',
  'lead_updated',
  'stage_changed',
  'note_added',
  'document_uploaded',
  'email_sent',
  'call_made',
  'meeting_scheduled',
  'task_created',
  'assigned',
  'converted',
  'archived',
] as const

export const DOCUMENT_CATEGORIES = [
  'passport',
  'quotation',
  'contract',
  'invoice',
  'visa',
  'itinerary',
  'other',
] as const

// ============================================================================
// TYPES
// ============================================================================

export type LeadSource = (typeof LEAD_SOURCES)[number]
export type LeadPipelineStage = (typeof PIPELINE_STAGES)[number]
export type LeadPriority = (typeof PRIORITIES)[number]
export type TravelType = (typeof TRAVEL_TYPES)[number]
export type LeadTag = (typeof LEAD_TAGS)[number]
export type LeadActiveStatus = (typeof LEAD_STATUSES)[number]
export type LeadActivityType = (typeof ACTIVITY_TYPES)[number]
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

export interface LeadRow {
  id: string
  lead_name: string
  company: string | null
  contact_person: string | null
  job_title: string | null
  email: string
  phone: string | null
  mobile: string | null
  website: string | null
  lead_source: LeadSource
  industry: string | null
  country: string | null
  city: string | null
  address: string | null
  notes: string | null
  assigned_to: string | null
  estimated_value: number
  currency: string
  travel_type: string | null
  expected_close_date: string
  priority: LeadPriority
  pipeline_stage: LeadPipelineStage
  probability: number
  status: LeadActiveStatus
  destination: string | null
  travel_date: string | null
  return_date: string | null
  adults: number
  children: number
  infants: number
  budget: number | null
  preferred_airline: string | null
  preferred_hotel: string | null
  visa_required: boolean
  special_requests: string | null
  tags: string[]
  attachment_urls: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LeadWithAgent extends LeadRow {
  assigned_agent?: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export interface LeadActivity {
  id: string
  lead_id: string
  activity_type: LeadActivityType
  title: string
  description: string | null
  performed_by: string | null
  metadata: Record<string, unknown>
  created_at: string
  performer?: {
    full_name: string
    avatar_url: string | null
  } | null
}

export interface LeadDocument {
  id: string
  lead_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size_kb: number | null
  document_category: DocumentCategory
  uploaded_by: string | null
  created_at: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: string
  recipient_id: string | null
  related_to_id: string | null
  related_to_type: string | null
  is_read: boolean
  created_at: string
}

export interface SalesAgent {
  id: string
  full_name: string
  first_name: string | null
  last_name: string | null
  role: string
  avatar_url: string | null
}

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

export const leadFormSchema = z.object({
  // Lead Information
  lead_name: z.string().min(1, 'Lead name is required').max(200),
  company: z.string().max(200).optional().default(''),
  contact_person: z.string().max(200).optional().default(''),
  job_title: z.string().max(200).optional().default(''),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().max(50).optional().default(''),
  mobile: z.string().max(50).optional().default(''),
  website: z.string().max(500).optional().default(''),
  lead_source: z.enum(LEAD_SOURCES).default('website'),
  industry: z.string().max(100).optional().default(''),
  country: z.string().max(100).optional().default(''),
  city: z.string().max(100).optional().default(''),
  address: z.string().max(500).optional().default(''),
  notes: z.string().max(5000).optional().default(''),

  // Sales Information
  assigned_to: z.string().min(1, 'Sales agent is required'),
  estimated_value: z.coerce.number().min(0, 'Value must be positive'),
  currency: z.string().default('USD'),
  travel_type: z.string().optional().default(''),
  expected_close_date: z.string().min(1, 'Expected close date is required'),
  priority: z.enum(PRIORITIES).default('medium'),
  pipeline_stage: z.enum(PIPELINE_STAGES).default('new'),
  probability: z.coerce.number().min(0).max(100).default(50),
  status: z.enum(LEAD_STATUSES).default('active'),

  // Customer Requirements
  destination: z.string().max(200).optional().default(''),
  travel_date: z.string().optional().default(''),
  return_date: z.string().optional().default(''),
  adults: z.coerce.number().min(0).default(1),
  children: z.coerce.number().min(0).default(0),
  infants: z.coerce.number().min(0).default(0),
  budget: z.coerce.number().min(0).optional(),
  preferred_airline: z.string().max(200).optional().default(''),
  preferred_hotel: z.string().max(200).optional().default(''),
  visa_required: z.boolean().default(false),
  special_requests: z.string().max(5000).optional().default(''),

  // Tags
  tags: z.array(z.string()).default([]),

  // Communication Center
  create_discussion: z.boolean().default(false),
})

export type LeadFormData = z.infer<typeof leadFormSchema>
