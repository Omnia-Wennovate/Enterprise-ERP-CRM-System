// Re-export finance types for convenience
export * from './finance'
export * from './marketing'
export * from './tech'
export * from './leads'

export type UserRole = 'super_admin' | 'admin' | 'sales_agent' | 'operations' | 'accountant' | 'hr_manager' | 'customer' | 'marketing'

export interface Profile {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  role: UserRole
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  department?: string
  position?: string
  employment_status?: string
  created_at: string
}

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  locked?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

// CRM Models
export type LeadStatus = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'email' | 'trade_show' | 'other'
export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'quotation' | 'proposal'
export type TaskStatus = 'to_do' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Lead {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  status: LeadStatus
  source: LeadSource
  estimated_value: number
  expected_close_date: string
  assigned_to: string
  assigned_to_name: string
  notes: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface Customer {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  customer_type: 'leisure' | 'corporate' | 'tour_operator' | 'travel_agency'
  annual_value: number
  is_active: boolean
  created_at: string
  updated_at: string
  last_booking_date: string | null
}

export interface Quotation {
  id: string
  quote_number: string
  customer_id: string
  customer_name: string
  status: QuotationStatus
  total_amount: number
  currency: string
  trip_destination: string
  trip_start_date: string
  trip_end_date: string
  num_travelers: number
  created_at: string
  valid_until: string
  sent_at: string | null
  accepted_at: string | null
  notes: string
  created_by: string
}

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  related_to: string // lead_id, customer_id, quotation_id, etc
  related_to_type: 'lead' | 'customer' | 'quotation' | 'task'
  assigned_to: string
  assigned_to_name: string
  due_date: string | null
  completed_at: string | null
  created_at: string
  created_by: string
  duration_minutes: number | null
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string
  assigned_to_name: string
  due_date: string
  completed_at: string | null
  related_to: string | null // lead_id, customer_id, etc
  related_to_type: 'lead' | 'customer' | 'quotation' | null
  created_at: string
  created_by: string
  is_reminder_set: boolean
}

// Bookings Models
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export interface Booking {
  id: string
  booking_reference: string
  customer_id: string
  customer_name: string
  destination: string
  trip_start_date: string
  trip_end_date: string
  status: BookingStatus
  total_cost: number
  currency: string
  num_travelers: number
  booking_type: string
  special_requests: string | null
  assigned_to: string | null
  assigned_to_name: string | null
  created_at: string
  updated_at: string
  created_by: string
  notes: string | null
}

export interface BookingTraveler {
  id: string
  booking_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  passport_number: string | null
  passport_expiry: string | null
  nationality: string | null
  room_type: string | null
  meal_plan: string | null
  special_requirements: string | null
  created_at: string
}

export interface BookingChecklist {
  id: string
  booking_id: string
  item_name: string
  category: string | null
  is_completed: boolean
  assigned_to: string | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BookingTimelineEvent {
  id: string
  booking_id: string
  event_type: string
  description: string
  event_date: string
  created_by: string | null
  related_to: string | null
  created_at: string
}

export interface BookingNote {
  id: string
  booking_id: string
  note_text: string
  created_by: string | null
  note_type: string
  is_private: boolean
  created_at: string
  updated_at: string
}

// Phase 3: Extended Bookings Models
export type BookingStatus = 'draft' | 'confirmed' | 'processing' | 'documents_ready' | 'travelled' | 'completed' | 'cancelled'
export type ChecklistCategory = 'documentation' | 'visa' | 'flights' | 'hotel' | 'customer'
export type TimelineEventType = 'created' | 'quote_accepted' | 'invoice_generated' | 'visa_applied' | 'documents_sent' | 'travelled' | 'status_changed'

export interface BookingListItem {
  id: string
  booking_reference: string
  customer_name: string
  destination: string
  trip_start_date: string
  trip_end_date: string
  status: BookingStatus
  assigned_to?: string
  total_cost: number
  num_travelers: number
}

export interface BookingDetail {
  id: string
  booking_reference: string
  customer_id: string
  customer_name: string
  destination: string
  booking_type?: string
  trip_start_date: string
  trip_end_date: string
  status: BookingStatus
  total_cost: number
  currency: string
  num_travelers: number
  assigned_to?: string
  assigned_to_name?: string
  special_requests?: string
  created_at: string
  updated_at: string
}

export interface BookingTravelerDetail {
  id: string
  booking_id: string
  first_name: string
  last_name: string
  passport_number?: string
  nationality?: string
  date_of_birth?: string
  phone?: string
  email?: string
  passport_expiry?: string
  room_type?: string
  meal_plan?: string
}

export interface ChecklistItem {
  id: string
  booking_id: string
  category?: string
  item_name: string
  is_completed: boolean
  assigned_to?: string
  due_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  booking_id: string
  event_type: TimelineEventType
  description?: string
  created_by?: string
  created_by_name?: string
  created_at: string
}

export interface BookingNoteDetail {
  id: string
  booking_id: string
  author_id?: string
  author_name?: string
  content: string
  mentions?: string[]
  edited: boolean
  created_at: string
  updated_at: string
}
