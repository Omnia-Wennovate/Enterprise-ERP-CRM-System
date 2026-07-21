// ============================================================================
// AI PROMPT ENGINEERING — Phase X
// System prompts and guardrails for enterprise-quality AI output
// ============================================================================

import type { AIItineraryPrompt } from '@/types/ai-itinerary'

// ── System Prompt (Section 17 Guardrails) ────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert enterprise travel operations assistant for Omnia TravelOS.
Your job is to generate detailed, professional travel itineraries for a travel company's Operations team.

CRITICAL RULES — FOLLOW EVERY ONE:

1. OUTPUT FORMAT: Always output valid JSON matching the exact schema provided. Never output prose-only responses. Never include markdown formatting, code fences, or explanatory text outside the JSON structure.

2. SUPPLIER NAMES: Never invent specific hotel, restaurant, or supplier names unless they are widely known landmarks or chain brands (e.g., "Burj Al Arab", "Hilton", "Emirates"). For suggested/unconfirmed suppliers, use descriptive placeholders like "4-star beachfront resort" or "upscale Italian restaurant near marina". Always set isSupplierConfirmed to false for AI-suggested suppliers and isAiSuggested to true.

3. TRAVELER CONSTRAINTS: Treat these as HARD constraints, not suggestions:
   - Accessibility Requirements: All suggested activities must be accessible
   - Children Traveling: Activities must be child-appropriate, age-considered
   - Senior Travelers: Activities must account for mobility limitations
   - Food Preference: All restaurant suggestions must comply (halal, vegan, etc.)
   - These constraints must be honored in EVERY activity, not just some

4. COST ESTIMATES: All cost figures are AI-estimated approximations based on typical market rates. Label them clearly. These are NOT confirmed prices and must be replaced with real supplier quotes by Operations staff before booking.

5. CONTENT ORIGINALITY: Generate original descriptive language only. Do not reproduce copyrighted guidebook text, copied reviews, or trademarked descriptions. Keep descriptions professional and informative.

6. REALISTIC SCHEDULING: 
   - Allow realistic travel time between locations
   - Don't overbook days (max 6-8 activities per day for active trips, 3-5 for relaxed)
   - Include buffer time for rest and meals
   - Consider opening hours of attractions
   - Account for jet lag on arrival days

7. PROFESSIONAL TONE: Write for Operations staff, not tourists. Be specific about logistics, timings, and practical details rather than generic travel-blog prose.

8. COMPLETENESS: Every day must have at minimum a morning and afternoon activity. Include hotel check-in on Day 1 and check-out on the last day. Include airport transfers when flights are part of the itinerary.`

// ── Prompt Builders ──────────────────────────────────────────────────────────

export function buildGenerationPrompt(input: AIItineraryPrompt): string {
  const parts: string[] = [SYSTEM_PROMPT]

  parts.push('\n\n--- USER REQUEST ---\n')
  parts.push(`Trip Description: ${input.naturalLanguagePrompt}`)

  if (input.destination) parts.push(`Destination: ${input.destination}`)
  if (input.countries?.length) parts.push(`Countries: ${input.countries.join(', ')}`)
  if (input.cities?.length) parts.push(`Cities: ${input.cities.join(', ')}`)
  if (input.tripLengthDays) parts.push(`Duration: ${input.tripLengthDays} days`)
  if (input.travelDates?.startDate) parts.push(`Start Date: ${input.travelDates.startDate}`)
  if (input.travelDates?.endDate) parts.push(`End Date: ${input.travelDates.endDate}`)
  if (input.travelStyle) parts.push(`Travel Style: ${input.travelStyle}`)
  if (input.budgetRange) {
    const budget = input.budgetRange
    if (budget.min && budget.max) {
      parts.push(`Budget: ${budget.currency} ${budget.min} - ${budget.max}`)
    } else if (budget.max) {
      parts.push(`Budget: Up to ${budget.currency} ${budget.max}`)
    }
  }
  if (input.travelerType) parts.push(`Traveler Type: ${input.travelerType}`)
  if (input.numTravelers) parts.push(`Number of Travelers: ${input.numTravelers}`)
  if (input.specialInterests?.length) parts.push(`Special Interests: ${input.specialInterests.join(', ')}`)
  if (input.language && input.language !== 'en') parts.push(`Preferred Language: ${input.language}`)
  if (input.accommodationPreference) parts.push(`Accommodation Preference: ${input.accommodationPreference}`)
  if (input.transportationPreference) parts.push(`Transportation Preference: ${input.transportationPreference}`)
  if (input.foodPreference) parts.push(`Food Preference: ${input.foodPreference} (HARD CONSTRAINT — all meal suggestions must comply)`)
  if (input.activityLevel) parts.push(`Activity Level: ${input.activityLevel}`)
  if (input.accessibilityRequirements) parts.push(`Accessibility Requirements: ${input.accessibilityRequirements} (HARD CONSTRAINT — all activities must be accessible)`)
  if (input.childrenTraveling && input.childrenTraveling.count > 0) {
    parts.push(`Children Traveling: ${input.childrenTraveling.count} children${input.childrenTraveling.ages?.length ? ` (ages: ${input.childrenTraveling.ages.join(', ')})` : ''} (HARD CONSTRAINT — all activities must be child-appropriate)`)
  }
  if (input.seniorTravelers && input.seniorTravelers.count > 0) {
    parts.push(`Senior Travelers: ${input.seniorTravelers.count} seniors${input.seniorTravelers.mobilityNotes ? ` (${input.seniorTravelers.mobilityNotes})` : ''} (HARD CONSTRAINT — activities must account for mobility)`)
  }
  if (input.specialRequests) parts.push(`Special Requests: ${input.specialRequests}`)

  // Existing form data context
  if (input.existingFormData) {
    const fd = input.existingFormData
    if (fd.baseCurrency) parts.push(`Base Currency: ${fd.baseCurrency}`)
    if (fd.localCurrency) parts.push(`Local Currency: ${fd.localCurrency}`)
    if (fd.timezone) parts.push(`Timezone: ${fd.timezone}`)
    if (fd.travelType) parts.push(`Travel Type: ${fd.travelType}`)
  }

  parts.push('\n--- OUTPUT SCHEMA ---\n')
  parts.push(`Generate a complete travel itinerary as a JSON object with this exact structure:
{
  "tripSummary": "Professional 2-3 paragraph summary of the trip",
  "destinationCountry": "Country name",
  "destinationCity": "Primary city",
  "travelType": "leisure|business|honeymoon|family|group|adventure|luxury|religious|medical|educational",
  "suggestedTitle": "Professional itinerary title",
  "baseCurrency": "USD",
  "localCurrency": "Local currency code if different",
  "timezone": "IANA timezone",
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD if dates provided",
      "title": "Day title (e.g. 'Arrival & City Discovery')",
      "description": "Brief day overview",
      "city": "City name",
      "country": "Country name",
      "weatherNote": "Expected weather note",
      "items": [
        {
          "type": "hotel|flight|transfer|restaurant|tour|shopping|free_time|custom|...",
          "title": "Activity title",
          "description": "Detailed description",
          "timeSlot": "morning|afternoon|evening|all_day",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "durationMinutes": 120,
          "location": "Location name",
          "address": "Full address if known",
          "supplierName": "Descriptive name (never invented specific names)",
          "isAiSuggested": true,
          "isSupplierConfirmed": false,
          "costEstimate": 150.00,
          "costCurrency": "USD",
          "notes": "Practical notes for operations",
          "priority": "low|medium|high",
          "metadata": {}
        }
      ]
    }
  ],
  "costEstimate": {
    "hotels": 0, "flights": 0, "meals": 0, "transport": 0,
    "tours": 0, "shopping": 0, "visa": 0, "insurance": 0,
    "taxes": 0, "miscellaneous": 0, "total": 0,
    "baseCurrency": "USD",
    "destinationCurrency": "Local currency",
    "exchangeRate": 1.0,
    "totalInDestinationCurrency": 0
  },
  "visaNotes": "Visa requirements and process",
  "packingTips": ["Tip 1", "Tip 2"],
  "emergencyContacts": {
    "police": "Number", "ambulance": "Number",
    "embassy": "Embassy name", "embassyPhone": "Number"
  },
  "weatherSuggestions": "Weather overview and what to expect",
  "localCustoms": ["Custom 1", "Custom 2"],
  "shoppingAreas": ["Area 1", "Area 2"],
  "freeTimeRecommendations": ["Recommendation 1"],
  "emergencyNotes": "Emergency information"
}`)

  return parts.join('\n')
}

export function buildRefinementPrompt(
  item: Record<string, unknown>,
  mode: string,
  context?: { dayNumber: number; destination: string; travelStyle?: string }
): string {
  return `${SYSTEM_PROMPT}

--- REFINEMENT REQUEST ---

Current activity:
${JSON.stringify(item, null, 2)}

Refinement mode: ${mode}
${context ? `Context: Day ${context.dayNumber} in ${context.destination}${context.travelStyle ? `, ${context.travelStyle} style` : ''}` : ''}

Modify this single activity according to the refinement mode:
- regenerate: Create a completely different activity for the same time slot and purpose
- improve: Enhance the description and add more practical details
- shorten: Make the activity shorter (reduce duration)
- expand: Make the activity longer with more content
- luxury: Upgrade to a premium/luxury version
- budget: Downgrade to a budget-friendly version
- family_friendly: Adapt for families with children
- business_friendly: Adapt for business travelers
- adventure: Make it more adventurous/active
- religious: Adapt for religious/cultural sensitivity
- senior_friendly: Adapt for senior travelers with mobility considerations
- kid_friendly: Adapt specifically for children's enjoyment

Return ONLY the modified activity as a JSON object matching the same schema. Keep isAiSuggested: true and isSupplierConfirmed: false.`
}

export function buildQualityCheckPrompt(
  itinerary: Record<string, unknown>,
  prompt: Record<string, unknown>
): string {
  return `${SYSTEM_PROMPT}

--- QUALITY CHECK REQUEST ---

Review this generated itinerary for quality issues.

Original request:
${JSON.stringify(prompt, null, 2)}

Generated itinerary:
${JSON.stringify(itinerary, null, 2)}

Check for ALL of the following issues:
1. Time conflicts (overlapping activities)
2. Missing hotel on any night
3. Missing airport transfer when flights exist
4. Duplicate activities
5. Visa reminders if destination requires visa
6. Impossible travel times between locations
7. Overbooked days (too many activities)
8. Weather conflicts (outdoor activities in bad weather season)
9. Missing emergency contacts
10. Constraint violations:
    - Food preference not honored in restaurant suggestions
    - Accessibility requirements not met
    - Activities inappropriate for children if children traveling
    - Activities too strenuous for senior travelers

Return a JSON object:
{
  "passed": true/false,
  "score": 0-100,
  "issues": [
    {
      "type": "time_conflict|missing_hotel|missing_transfer|duplicate_activity|visa_reminder|passport_expiry|impossible_travel_time|overbooked_day|weather_conflict|closed_attraction|missing_emergency_contacts|constraint_violation|unconfirmed_supplier",
      "severity": "error|warning|info",
      "message": "Human-readable description",
      "dayNumber": 1,
      "itemTitle": "Activity name if applicable",
      "suggestion": "How to fix this"
    }
  ],
  "checkedAt": "ISO timestamp"
}`
}

export function buildChatAssistantPrompt(
  message: string,
  itineraryContext: Record<string, unknown>,
  history: Array<{ role: string; content: string }>
): string {
  return `${SYSTEM_PROMPT}

--- AI TRAVEL ASSISTANT ---

You are a conversational assistant helping Operations staff edit an existing itinerary.
The user will give natural language instructions like "Add a desert safari on Day 3" or "Move Burj Khalifa to Day 2".

Current itinerary state:
${JSON.stringify(itineraryContext, null, 2)}

Conversation history:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

User message: ${message}

Respond with a JSON object:
{
  "message": "Friendly confirmation of what you'll do",
  "actions": [
    {
      "type": "add_item|move_item|remove_item|replace_item|update_item",
      "dayNumber": 3,
      "itemId": "existing-item-id if modifying",
      "targetDayNumber": 2,
      "newItem": { ... activity object if adding/replacing ... },
      "description": "Human-readable description of this action"
    }
  ]
}

If the user's request is unclear, ask for clarification in the "message" field and return an empty "actions" array.
Always preserve existing data. Only modify what the user explicitly asks to change.`
}

export function buildRegenerateDayPrompt(
  itinerary: Record<string, unknown>,
  dayNumber: number,
  instructions?: string
): string {
  return `${SYSTEM_PROMPT}

--- REGENERATE DAY REQUEST ---

Current full itinerary:
${JSON.stringify(itinerary, null, 2)}

Regenerate ONLY Day ${dayNumber}. Keep all other days exactly as they are.
${instructions ? `Additional instructions: ${instructions}` : ''}

The regenerated day should:
- Fit naturally with the surrounding days
- Not duplicate activities from other days
- Maintain the same city/location unless instructed otherwise
- Follow the same travel style and constraints

Return ONLY the regenerated day object as JSON, matching the day schema.`
}

export function buildRegenerateSlotPrompt(
  itinerary: Record<string, unknown>,
  dayNumber: number,
  timeSlot: string,
  instructions?: string
): string {
  return `${SYSTEM_PROMPT}

--- REGENERATE TIME SLOT REQUEST ---

Current full itinerary:
${JSON.stringify(itinerary, null, 2)}

Regenerate ONLY the ${timeSlot} activities for Day ${dayNumber}.
Keep all other time slots and days exactly as they are.
${instructions ? `Additional instructions: ${instructions}` : ''}

Return ONLY an array of activity objects for the ${timeSlot} slot, matching the item schema.`
}

export function buildRegenerateCategoryPrompt(
  itinerary: Record<string, unknown>,
  category: string,
  instructions?: string
): string {
  return `${SYSTEM_PROMPT}

--- REGENERATE CATEGORY REQUEST ---

Current full itinerary:
${JSON.stringify(itinerary, null, 2)}

Regenerate ALL ${category} across the entire itinerary.
Keep all other activity types exactly as they are.
${instructions ? `Additional instructions: ${instructions}` : ''}

Return a JSON object mapping day numbers to arrays of replacement items:
{
  "replacements": {
    "1": [{ ...item }, { ...item }],
    "3": [{ ...item }]
  }
}

Only include days that had ${category} activities.`
}
