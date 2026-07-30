import { z } from 'zod'

// ============================================================================
// CONSTANTS
// ============================================================================

export const QUOTATION_STATUSES = [
  'draft',
  'ready',
  'sent',
  'viewed',
  'negotiation',
  'accepted',
  'rejected',
  'expired',
  'converted',
] as const

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  sent: 'Sent',
  viewed: 'Viewed',
  negotiation: 'Negotiation',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  converted: 'Converted',
}

export const QUOTATION_STATUS_COLORS: Record<
  QuotationStatus,
  { text: string; bg: string; dot: string }
> = {
  draft:       { text: 'text-gray-700',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  ready:       { text: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  sent:        { text: 'text-indigo-700', bg: 'bg-indigo-100', dot: 'bg-indigo-500' },
  viewed:      { text: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500' },
  negotiation: { text: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  accepted:    { text: 'text-green-700',  bg: 'bg-green-100',  dot: 'bg-green-500' },
  rejected:    { text: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500' },
  expired:     { text: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
  converted:   { text: 'text-teal-700',   bg: 'bg-teal-100',   dot: 'bg-teal-500' },
}

export const QUOTE_TYPES = ['manual', 'from_lead', 'from_customer', 'from_booking'] as const

export const QUOTE_TYPE_LABELS: Record<QuoteType, string> = {
  manual:          'Manual Quotation',
  from_lead:       'From CRM Lead',
  from_customer:   'From Existing Customer',
  from_booking:    'From Booking',
}

export const SERVICE_TYPES = [
  'Flight',
  'Hotel',
  'Transfer',
  'Visa',
  'Insurance',
  'Tours',
  'Activities',
  'Meals',
  'Other',
] as const

export const TRAVEL_TYPES_QT = [
  'leisure',
  'business',
  'group',
  'corporate',
  'educational',
  'medical',
  'religious',
  'vip',
] as const

export const CURRENCIES_QT = [
  'USD', 'EUR', 'GBP', 'AED', 'SAR', 'ETB', 'KES', 'EGP', 'INR', 'CNY',
] as const

export const PAYMENT_TERMS_OPTIONS = [
  '50% deposit, 50% before travel',
  '100% upfront',
  '30 days net',
  '60 days net',
  'On delivery',
  'Custom',
] as const

// ============================================================================
// TYPES
// ============================================================================

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number]
export type QuoteType       = (typeof QUOTE_TYPES)[number]
export type ServiceType     = (typeof SERVICE_TYPES)[number]

export interface QuotationItem {
  id?:          string
  quotation_id?: string
  service:      string
  description:  string
  quantity:     number
  unit_price:   number
  discount:     number
  tax_rate:     number
  total:        number
  sort_order:   number
}

export interface QuotationRow {
  id:                     string
  quote_number:           string
  quote_type:             QuoteType
  lead_id:                string | null
  customer_id:            string | null
  customer_name:          string
  company:                string | null
  contact_person:         string | null
  email:                  string | null
  phone:                  string | null
  quote_title:            string
  destination:            string
  country:                string | null
  city:                   string | null
  travel_type:            string | null
  departure_date:         string
  return_date:            string
  adults:                 number
  children:               number
  infants:                number
  currency:               string
  subtotal:               number
  discount_amount:        number
  tax_amount:             number
  grand_total:            number
  quotation_date:         string
  valid_until:            string
  payment_terms:          string | null
  cancellation_policy:    string | null
  notes:                  string | null
  internal_notes:         string | null
  status:                 QuotationStatus
  attachment_urls:        string[]
  sent_at:                string | null
  viewed_at:              string | null
  accepted_at:            string | null
  rejected_at:            string | null
  converted_to_booking_id: string | null
  created_by:             string | null
  created_at:             string
  updated_at:             string
}

export interface QuotationWithItems extends QuotationRow {
  items: QuotationItem[]
  creator_name?: string | null
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const quotationItemSchema = z.object({
  id:          z.string().optional(),
  service:     z.string().min(1, 'Service is required'),
  description: z.string().default(''),
  quantity:    z.coerce.number().min(1).default(1),
  unit_price:  z.coerce.number().min(0).default(0),
  discount:    z.coerce.number().min(0).max(100).default(0),
  tax_rate:    z.coerce.number().min(0).max(100).default(0),
  total:       z.coerce.number().default(0),
  sort_order:  z.number().default(0),
})

export const quotationFormSchema = z.object({
  // Source
  quote_type:   z.enum(QUOTE_TYPES).default('manual'),
  lead_id:      z.string().optional().default(''),

  // Customer
  customer_name:   z.string().min(1, 'Customer name is required'),
  company:         z.string().optional().default(''),
  contact_person:  z.string().optional().default(''),
  email:           z.string().optional().default(''),
  phone:           z.string().optional().default(''),

  // Trip
  quote_title:    z.string().min(1, 'Quote title is required'),
  destination:    z.string().min(1, 'Destination is required'),
  country:        z.string().optional().default(''),
  city:           z.string().optional().default(''),
  travel_type:    z.string().optional().default(''),
  departure_date: z.string().min(1, 'Departure date is required'),
  return_date:    z.string().min(1, 'Return date is required'),
  adults:         z.coerce.number().min(1).default(1),
  children:       z.coerce.number().min(0).default(0),
  infants:        z.coerce.number().min(0).default(0),

  // Pricing
  currency:        z.string().default('USD'),
  items:           z.array(quotationItemSchema).default([]),
  subtotal:        z.coerce.number().default(0),
  discount_amount: z.coerce.number().default(0),
  tax_amount:      z.coerce.number().default(0),
  grand_total:     z.coerce.number().default(0),

  // Terms
  quotation_date:      z.string().default(''),
  valid_until:         z.string().min(1, 'Valid until date is required'),
  payment_terms:       z.string().optional().default(''),
  cancellation_policy: z.string().optional().default(''),
  notes:               z.string().optional().default(''),
  internal_notes:      z.string().optional().default(''),

  // Status
  status: z.enum(QUOTATION_STATUSES).default('draft'),
})

export type QuotationFormData = z.infer<typeof quotationFormSchema>
export type QuotationItemFormData = z.infer<typeof quotationItemSchema>
