// ============================================================================
// AI ITINERARY TYPES & ZOD SCHEMAS — Phase X
// Single source of truth for AI generation request/response validation
// ============================================================================

import { z } from 'zod'
import type { ActivityType, TravelType } from './itinerary'

// ── AI Provider Types ────────────────────────────────────────────────────────

export type AIProviderName = 'gemini' | 'openai' | 'claude' | 'azure' | 'local'

export interface AIProviderConfig {
  name: AIProviderName
  model: string
  apiKey: string
  baseUrl?: string
  timeout?: number
}

// ── AI Prompt Input ──────────────────────────────────────────────────────────

export const AIItineraryPromptSchema = z.object({
  // Natural language description
  naturalLanguagePrompt: z.string().min(1, 'Please describe the trip'),

  // Structured parameters (all optional — AI infers from prompt)
  destination: z.string().optional(),
  countries: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  travelDates: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
  tripLengthDays: z.number().int().min(1).max(90).optional(),
  travelStyle: z.enum([
    'luxury', 'budget', 'mid-range', 'backpacker', 'business',
    'adventure', 'cultural', 'relaxation', 'romantic', 'family',
  ]).optional(),
  budgetRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('USD'),
  }).optional(),
  travelerType: z.enum([
    'solo', 'couple', 'family', 'group', 'business', 'honeymoon',
    'seniors', 'students',
  ]).optional(),
  numTravelers: z.number().int().min(1).optional(),
  specialInterests: z.array(z.string()).optional(),
  language: z.string().default('en'),
  accommodationPreference: z.enum([
    'hotel', 'resort', 'boutique', 'hostel', 'apartment', 'villa',
    'ryokan', 'riad', 'any',
  ]).optional(),
  transportationPreference: z.enum([
    'private_car', 'public_transit', 'rental_car', 'walking',
    'taxi', 'mixed', 'any',
  ]).optional(),
  foodPreference: z.enum([
    'local_cuisine', 'international', 'vegetarian', 'vegan',
    'halal', 'kosher', 'gluten_free', 'any',
  ]).optional(),
  activityLevel: z.enum([
    'relaxed', 'moderate', 'active', 'intensive',
  ]).optional(),
  accessibilityRequirements: z.string().optional(),
  childrenTraveling: z.object({
    count: z.number().int().min(0),
    ages: z.array(z.number()).optional(),
  }).optional(),
  seniorTravelers: z.object({
    count: z.number().int().min(0),
    mobilityNotes: z.string().optional(),
  }).optional(),
  specialRequests: z.string().optional(),

  // Template reference (optional starting point)
  templateId: z.string().uuid().optional(),

  // Existing form data to pre-populate
  existingFormData: z.object({
    title: z.string().optional(),
    bookingId: z.string().optional(),
    destinationCountry: z.string().optional(),
    destinationCity: z.string().optional(),
    travelType: z.string().optional(),
    baseCurrency: z.string().optional(),
    localCurrency: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
})

export type AIItineraryPrompt = z.infer<typeof AIItineraryPromptSchema>

// ── AI Generated Itinerary Response ──────────────────────────────────────────

export const AIGeneratedItemSchema = z.object({
  type: z.enum([
    'flight', 'hotel', 'transfer', 'train', 'cruise',
    'restaurant', 'tour', 'visa_appointment', 'documents',
    'meeting', 'medical', 'religious', 'event', 'shopping',
    'free_time', 'custom',
  ]),
  title: z.string(),
  description: z.string().optional(),
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'all_day']),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().int().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  supplierName: z.string().optional(),
  isAiSuggested: z.boolean().default(true),
  isSupplierConfirmed: z.boolean().default(false),
  costEstimate: z.number().optional(),
  costCurrency: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const AIGeneratedDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  date: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  weatherNote: z.string().optional(),
  items: z.array(AIGeneratedItemSchema),
})

export const AICostEstimateSchema = z.object({
  hotels: z.number().default(0),
  flights: z.number().default(0),
  meals: z.number().default(0),
  transport: z.number().default(0),
  tours: z.number().default(0),
  shopping: z.number().default(0),
  visa: z.number().default(0),
  insurance: z.number().default(0),
  taxes: z.number().default(0),
  miscellaneous: z.number().default(0),
  total: z.number().default(0),
  baseCurrency: z.string().default('USD'),
  destinationCurrency: z.string().optional(),
  exchangeRate: z.number().optional(),
  totalInDestinationCurrency: z.number().optional(),
})

export const AIGeneratedItinerarySchema = z.object({
  // Trip overview
  tripSummary: z.string(),
  destinationCountry: z.string(),
  destinationCity: z.string(),
  travelType: z.enum([
    'leisure', 'business', 'honeymoon', 'family', 'group',
    'adventure', 'luxury', 'religious', 'medical', 'educational',
  ]),

  // Generated days
  days: z.array(AIGeneratedDaySchema).min(1),

  // Cost estimation
  costEstimate: AICostEstimateSchema,

  // Travel info
  visaNotes: z.string().optional(),
  packingTips: z.array(z.string()).optional(),
  localCurrency: z.string().optional(),
  timezone: z.string().optional(),
  emergencyContacts: z.object({
    police: z.string().optional(),
    ambulance: z.string().optional(),
    embassy: z.string().optional(),
    embassyPhone: z.string().optional(),
  }).optional(),
  weatherSuggestions: z.string().optional(),
  localCustoms: z.array(z.string()).optional(),
  shoppingAreas: z.array(z.string()).optional(),
  freeTimeRecommendations: z.array(z.string()).optional(),
  emergencyNotes: z.string().optional(),

  // Metadata
  suggestedTitle: z.string(),
  baseCurrency: z.string().default('USD'),
})

export type AIGeneratedItem = z.infer<typeof AIGeneratedItemSchema>
export type AIGeneratedDay = z.infer<typeof AIGeneratedDaySchema>
export type AICostEstimate = z.infer<typeof AICostEstimateSchema>
export type AIGeneratedItinerary = z.infer<typeof AIGeneratedItinerarySchema>

// ── AI Quality Check ─────────────────────────────────────────────────────────

export const AIQualityIssueSchema = z.object({
  type: z.enum([
    'time_conflict',
    'missing_hotel',
    'missing_transfer',
    'duplicate_activity',
    'visa_reminder',
    'passport_expiry',
    'impossible_travel_time',
    'overbooked_day',
    'weather_conflict',
    'closed_attraction',
    'missing_emergency_contacts',
    'constraint_violation',
    'unconfirmed_supplier',
  ]),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  dayNumber: z.number().int().optional(),
  itemTitle: z.string().optional(),
  suggestion: z.string().optional(),
})

export const AIQualityCheckResultSchema = z.object({
  passed: z.boolean(),
  issues: z.array(AIQualityIssueSchema),
  score: z.number().min(0).max(100),
  checkedAt: z.string(),
})

export type AIQualityIssue = z.infer<typeof AIQualityIssueSchema>
export type AIQualityCheckResult = z.infer<typeof AIQualityCheckResultSchema>

// ── AI Refinement ────────────────────────────────────────────────────────────

export type AIRefineMode =
  | 'regenerate' | 'improve' | 'shorten' | 'expand'
  | 'luxury' | 'budget' | 'family_friendly' | 'business_friendly'
  | 'adventure' | 'religious' | 'senior_friendly' | 'kid_friendly'

export interface AIRefineRequest {
  item: AIGeneratedItem
  mode: AIRefineMode
  context?: {
    dayNumber: number
    destination: string
    travelStyle?: string
  }
}

// ── AI Chat Assistant ────────────────────────────────────────────────────────

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface AIChatRequest {
  message: string
  itineraryContext: {
    itineraryId: string
    days: Array<{
      dayNumber: number
      title: string
      items: Array<{
        id: string
        title: string
        type: string
        time?: string
      }>
    }>
    destination: string
    travelType: string
  }
  conversationHistory: AIChatMessage[]
}

export interface AIChatResponse {
  message: string
  actions: AIChatAction[]
}

export interface AIChatAction {
  type: 'add_item' | 'move_item' | 'remove_item' | 'replace_item' | 'update_item'
  dayNumber: number
  itemId?: string
  newItem?: Partial<AIGeneratedItem>
  targetDayNumber?: number
  description: string
}

// ── AI Generation State (for UI) ─────────────────────────────────────────────

export type AIGenerationStatus =
  | 'idle'
  | 'generating'
  | 'streaming'
  | 'quality_checking'
  | 'completed'
  | 'error'
  | 'cancelled'

export interface AIGenerationState {
  status: AIGenerationStatus
  progress: number // 0-100
  currentStep: string
  generatedItinerary: AIGeneratedItinerary | null
  qualityCheck: AIQualityCheckResult | null
  error: string | null
  generationId: string | null
}

// ── AI Template ──────────────────────────────────────────────────────────────

export interface AITemplate {
  id: string
  name: string
  description: string | null
  destination_country: string | null
  destination_city: string | null
  travel_type: string | null
  duration_days: number | null
  template_data: AIGeneratedItinerary
  tags: string[]
  usage_count: number
  source_itinerary_id: string | null
  created_by: string | null
  created_at: string
}

// ── Regeneration Request ─────────────────────────────────────────────────────

export interface AIRegenerateRequest {
  generatedItinerary: AIGeneratedItinerary
  target: {
    type: 'day' | 'time_slot' | 'category'
    dayNumber?: number
    timeSlot?: 'morning' | 'afternoon' | 'evening'
    category?: 'hotels' | 'restaurants' | 'tours' | 'transport' | 'shopping'
  }
  instructions?: string
  originalPrompt: AIItineraryPrompt
}
