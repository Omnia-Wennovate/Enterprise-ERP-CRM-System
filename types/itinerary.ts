// ============================================================================
// ITINERARY TYPES — Enterprise Travel Operations
// ============================================================================

export type ItineraryStatus = 'draft' | 'planning' | 'review' | 'customer_review' | 'approved' | 'completed' | 'cancelled'
export type TravelAdvisoryLevel = 'normal' | 'caution' | 'reconsider' | 'do_not_travel'
export type ActivityType =
  | 'flight' | 'hotel' | 'transfer' | 'train' | 'cruise'
  | 'restaurant' | 'tour' | 'visa_appointment' | 'documents'
  | 'meeting' | 'medical' | 'religious' | 'event' | 'shopping'
  | 'free_time' | 'custom'
export type ActivityStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type TravelType = 'leisure' | 'business' | 'honeymoon' | 'family' | 'group' | 'adventure' | 'luxury' | 'religious' | 'medical' | 'educational'
export type VisaRequirement = 'visa_required' | 'visa_on_arrival' | 'visa_free' | 'e_visa'

// ── Core Models ──────────────────────────────────────────────────────────────

export interface Itinerary {
  id: string
  booking_id: string | null
  title: string
  status: ItineraryStatus
  destination_country: string | null
  destination_city: string | null
  cover_image_url: string | null
  base_currency: string
  local_currency: string | null
  exchange_rate: number | null
  exchange_rate_date: string | null
  timezone: string
  travel_advisory_level: TravelAdvisoryLevel
  travel_advisory_note: string | null
  emergency_police: string | null
  emergency_ambulance: string | null
  emergency_embassy: string | null
  emergency_embassy_phone: string | null
  version: number
  is_template: boolean
  template_name: string | null
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  assigned_to: string | null
  assigned_to_name: string | null
  share_token: string | null
  total_cost: number
  notes: string | null
  travel_type: TravelType
  created_at: string
  updated_at: string
}

export interface ItineraryWithBooking extends Itinerary {
  booking?: {
    id: string
    booking_reference: string
    customer_name: string
    destination: string
    trip_start_date: string
    trip_end_date: string
    status: string
    total_cost: number
    currency: string
    num_travelers: number
    assigned_to_name: string | null
  } | null
  days?: ItineraryDay[]
  travelers?: {
    id: string
    first_name: string
    last_name: string
    nationality: string | null
    passport_number: string | null
    passport_expiry: string | null
  }[]
}

export interface ItineraryDay {
  id: string
  itinerary_id: string
  day_number: number
  date: string | null
  title: string | null
  sort_order: number
  description: string | null
  timezone: string | null
  weather_note: string | null
  city: string | null
  country: string | null
  items?: ItineraryItem[]
}

export interface ItineraryItem {
  id: string
  day_id: string
  type: ActivityType
  time: string | null
  title: string
  description: string | null
  sort_order: number
  location: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  supplier_id: string | null
  supplier_name: string | null
  supplier_contact: string | null
  booking_reference: string | null
  voucher_number: string | null
  cost: number
  currency: string
  cost_local: number | null
  currency_local: string | null
  exchange_rate: number | null
  status: ActivityStatus
  start_time: string | null
  end_time: string | null
  duration_minutes: number | null
  timezone: string | null
  metadata: FlightMeta | HotelMeta | TransportMeta | Record<string, unknown>
  traveler_ids: string[]
  attachments: Attachment[]
  notes: string | null
  contact_phone: string | null
  contact_email: string | null
  live_status_enabled: boolean
  flight_status: string | null
  created_at: string
  updated_at: string
}

// ── Activity Metadata Types ──────────────────────────────────────────────────

export interface FlightMeta {
  airline: string
  airline_logo?: string
  flight_number: string
  departure_airport: string
  departure_code: string
  departure_terminal?: string
  departure_gate?: string
  arrival_airport: string
  arrival_code: string
  arrival_terminal?: string
  arrival_gate?: string
  cabin_class: string
  seat?: string
  pnr?: string
  baggage_allowance?: string
  aircraft_type?: string
}

export interface HotelMeta {
  hotel_name: string
  star_rating: number
  room_type: string
  check_in_time?: string
  check_out_time?: string
  breakfast_included: boolean
  wifi_included: boolean
  address: string
  phone?: string
  website?: string
  confirmation_number?: string
  special_instructions?: string
}

export interface TransportMeta {
  vehicle_type: string
  driver_name?: string
  driver_phone?: string
  plate_number?: string
  pickup_location: string
  dropoff_location: string
  meeting_point?: string
  company?: string
}

export interface Attachment {
  name: string
  url: string
  type: string
  size_kb?: number
}

// ── Comments ─────────────────────────────────────────────────────────────────

export interface ItineraryComment {
  id: string
  itinerary_id: string
  author_id: string
  author_name: string | null
  content: string
  department: string | null
  parent_id: string | null
  is_internal: boolean
  created_at: string
  updated_at: string
}

// ── Versions ─────────────────────────────────────────────────────────────────

export interface ItineraryVersion {
  id: string
  itinerary_id: string
  version_number: number
  snapshot: unknown
  change_summary: string | null
  created_by: string | null
  created_at: string
}

// ── Dashboard KPIs ───────────────────────────────────────────────────────────

export interface ItineraryKPIs {
  totalActive: number
  upcomingTrips: number
  totalTravelers: number
  totalCountries: number
  todayDepartures: number
  todayArrivals: number
  pendingApproval: number
  completedTrips: number
}

// ── Filter Types ─────────────────────────────────────────────────────────────

export interface ItineraryFilters {
  search: string
  status: ItineraryStatus | 'all'
  travelType: TravelType | 'all'
  country: string
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'upcoming' | 'completed' | 'cancelled'
  assignedTo: string
}

// ── Activity type configs ────────────────────────────────────────────────────

export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string; color: string }[] = [
  { value: 'flight', label: 'Flight', icon: 'Plane', color: '#3B82F6' },
  { value: 'hotel', label: 'Hotel', icon: 'Building2', color: '#8B5CF6' },
  { value: 'transfer', label: 'Transfer', icon: 'Car', color: '#F59E0B' },
  { value: 'train', label: 'Train', icon: 'TrainFront', color: '#10B981' },
  { value: 'cruise', label: 'Cruise', icon: 'Ship', color: '#06B6D4' },
  { value: 'restaurant', label: 'Restaurant', icon: 'UtensilsCrossed', color: '#EF4444' },
  { value: 'tour', label: 'Tour', icon: 'Camera', color: '#F97316' },
  { value: 'visa_appointment', label: 'Visa Appointment', icon: 'Stamp', color: '#6366F1' },
  { value: 'documents', label: 'Documents', icon: 'FileText', color: '#64748B' },
  { value: 'meeting', label: 'Meeting', icon: 'Users', color: '#0EA5E9' },
  { value: 'medical', label: 'Medical', icon: 'Heart', color: '#EC4899' },
  { value: 'religious', label: 'Religious', icon: 'Church', color: '#A855F7' },
  { value: 'event', label: 'Event', icon: 'PartyPopper', color: '#F43F5E' },
  { value: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#14B8A6' },
  { value: 'free_time', label: 'Free Time', icon: 'Coffee', color: '#78716C' },
  { value: 'custom', label: 'Custom', icon: 'Sparkles', color: '#0A8FA8' },
]

export const ITINERARY_STATUSES: { value: ItineraryStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'planning', label: 'Planning', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'review', label: 'Manager Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'customer_review', label: 'Customer Review', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'approved', label: 'Approved', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'completed', label: 'Completed', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
]

export const TRAVEL_TYPES: { value: TravelType; label: string }[] = [
  { value: 'leisure', label: 'Leisure' },
  { value: 'business', label: 'Business' },
  { value: 'honeymoon', label: 'Honeymoon' },
  { value: 'family', label: 'Family' },
  { value: 'group', label: 'Group' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'religious', label: 'Religious' },
  { value: 'medical', label: 'Medical Tourism' },
  { value: 'educational', label: 'Educational' },
]
