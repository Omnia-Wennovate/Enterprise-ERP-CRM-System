'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Sparkles, Wand2, Loader2, X, ChevronDown, ChevronUp,
  Globe, Calendar, Users, DollarSign, Utensils, Accessibility,
  Baby, HeartPulse, MapPin, Languages, Car, Bed, Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIGeneratedPreview } from './AIGeneratedPreview'
import type {
  AIGeneratedItinerary, AIGenerationState, AIItineraryPrompt,
  AIQualityCheckResult, AIRefineMode, AIGeneratedItem
} from '@/types/ai-itinerary'

interface AIItineraryPanelProps {
  formData: {
    title: string
    booking_id: string
    destination_country: string
    destination_city: string
    travel_type: string
    base_currency: string
    local_currency: string
    timezone: string
  }
  onAcceptPlan: (itinerary: AIGeneratedItinerary, generationId: string | null) => Promise<void>
}

export function AIItineraryPanel({ formData, onAcceptPlan }: AIItineraryPanelProps) {
  // Generation state
  const [state, setState] = useState<AIGenerationState>({
    status: 'idle',
    progress: 0,
    currentStep: '',
    generatedItinerary: null,
    qualityCheck: null,
    error: null,
    generationId: null,
  })

  // Prompt fields
  const [prompt, setPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [params, setParams] = useState<Partial<AIItineraryPrompt>>({
    travelStyle: undefined,
    tripLengthDays: undefined,
    budgetRange: undefined,
    travelerType: undefined,
    numTravelers: undefined,
    specialInterests: [],
    language: 'en',
    accommodationPreference: undefined,
    transportationPreference: undefined,
    foodPreference: undefined,
    activityLevel: undefined,
    accessibilityRequirements: '',
    childrenTraveling: undefined,
    seniorTravelers: undefined,
    specialRequests: '',
  })

  const abortRef = useRef<AbortController | null>(null)
  const [accepting, setAccepting] = useState(false)

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    abortRef.current = new AbortController()

    setState({
      status: 'generating',
      progress: 10,
      currentStep: 'Preparing AI prompt...',
      generatedItinerary: null,
      qualityCheck: null,
      error: null,
      generationId: null,
    })

    try {
      // Build request
      const request: AIItineraryPrompt = {
        naturalLanguagePrompt: prompt,
        destination: formData.destination_city || formData.destination_country || undefined,
        countries: formData.destination_country ? [formData.destination_country] : undefined,
        cities: formData.destination_city ? [formData.destination_city] : undefined,
        ...params,
        language: params.language || 'en',
        existingFormData: {
          title: formData.title || undefined,
          bookingId: formData.booking_id || undefined,
          destinationCountry: formData.destination_country || undefined,
          destinationCity: formData.destination_city || undefined,
          travelType: formData.travel_type || undefined,
          baseCurrency: formData.base_currency || undefined,
          localCurrency: formData.local_currency || undefined,
          timezone: formData.timezone || undefined,
        },
      }

      setState(s => ({ ...s, progress: 30, currentStep: 'Generating itinerary with AI...' }))

      // Call API
      const res = await fetch('/api/ai-itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const data = await res.json()

      setState(s => ({
        ...s,
        status: 'quality_checking',
        progress: 70,
        currentStep: 'Running quality checks...',
        generatedItinerary: data.itinerary,
        generationId: data.generationId,
      }))

      // Run quality check
      try {
        const qcRes = await fetch('/api/ai-itinerary/quality-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itinerary: data.itinerary, prompt: request }),
          signal: abortRef.current.signal,
        })

        if (qcRes.ok) {
          const qcData = await qcRes.json()
          setState(s => ({ ...s, qualityCheck: qcData.qualityCheck }))
        }
      } catch {
        // Quality check failure is non-critical
        console.warn('Quality check failed, continuing without')
      }

      setState(s => ({
        ...s,
        status: 'completed',
        progress: 100,
        currentStep: 'Generation complete!',
      }))
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState(s => ({ ...s, status: 'cancelled', currentStep: 'Generation cancelled' }))
      } else {
        setState(s => ({
          ...s,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
          currentStep: 'Generation failed',
        }))
      }
    }
  }, [prompt, params, formData])

  // ── Cancel ─────────────────────────────────────────────────────────────────

  const handleCancel = () => {
    abortRef.current?.abort()
    setState(s => ({ ...s, status: 'cancelled', currentStep: 'Cancelled' }))
  }

  // ── Accept Plan ────────────────────────────────────────────────────────────

  const handleAccept = async () => {
    if (!state.generatedItinerary) return
    setAccepting(true)
    try {
      await onAcceptPlan(state.generatedItinerary, state.generationId)
    } catch (err) {
      console.error('Failed to accept AI plan:', err)
      alert('Failed to save itinerary. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  // ── Regenerate Day ─────────────────────────────────────────────────────────

  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerateDay = async (dayNumber: number) => {
    if (!state.generatedItinerary) return
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/ai-itinerary/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedItinerary: state.generatedItinerary,
          target: { type: 'day', dayNumber },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setState(s => {
          if (!s.generatedItinerary) return s
          const newDays = s.generatedItinerary.days.map(d =>
            d.dayNumber === dayNumber ? data.day : d
          )
          return {
            ...s,
            generatedItinerary: { ...s.generatedItinerary, days: newDays },
          }
        })
      }
    } catch (err) {
      console.error('Failed to regenerate day:', err)
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleRegenerateSlot = async (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening') => {
    if (!state.generatedItinerary) return
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/ai-itinerary/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedItinerary: state.generatedItinerary,
          target: { type: 'time_slot', dayNumber, timeSlot: slot },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setState(s => {
          if (!s.generatedItinerary) return s
          const newDays = s.generatedItinerary.days.map(d => {
            if (d.dayNumber !== dayNumber) return d
            const otherItems = d.items.filter(i => i.timeSlot !== slot)
            return { ...d, items: [...otherItems, ...data.items] }
          })
          return {
            ...s,
            generatedItinerary: { ...s.generatedItinerary, days: newDays },
          }
        })
      }
    } catch (err) {
      console.error('Failed to regenerate slot:', err)
    } finally {
      setIsRegenerating(false)
    }
  }

  // ── Refine Item ────────────────────────────────────────────────────────────

  const handleRefineItem = async (dayIndex: number, itemIndex: number, mode: AIRefineMode) => {
    if (!state.generatedItinerary) return
    const day = state.generatedItinerary.days[dayIndex]
    const item = day.items[itemIndex]
    if (!item) return

    try {
      const res = await fetch('/api/ai-itinerary/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          mode,
          context: {
            dayNumber: day.dayNumber,
            destination: state.generatedItinerary.destinationCity,
            travelStyle: state.generatedItinerary.travelType,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setState(s => {
          if (!s.generatedItinerary) return s
          const newDays = [...s.generatedItinerary.days]
          const newItems = [...newDays[dayIndex].items]
          newItems[itemIndex] = data.item
          newDays[dayIndex] = { ...newDays[dayIndex], items: newItems }
          return {
            ...s,
            generatedItinerary: { ...s.generatedItinerary, days: newDays },
          }
        })
      }
    } catch (err) {
      console.error('Failed to refine item:', err)
    }
  }

  const handleUpdateItem = (dayIndex: number, itemIndex: number, item: AIGeneratedItem) => {
    setState(s => {
      if (!s.generatedItinerary) return s
      const newDays = [...s.generatedItinerary.days]
      const newItems = [...newDays[dayIndex].items]
      newItems[itemIndex] = item
      newDays[dayIndex] = { ...newDays[dayIndex], items: newItems }
      return {
        ...s,
        generatedItinerary: { ...s.generatedItinerary, days: newDays },
      }
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isGenerating = state.status === 'generating' || state.status === 'streaming' || state.status === 'quality_checking'

  return (
    <div className="space-y-4">
      {/* Prompt Input */}
      {state.status !== 'completed' && (
        <>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Describe the trip
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              disabled={isGenerating}
              placeholder="e.g. Luxury honeymoon in Dubai for 5 days with spa treatments and desert safari. Budget around $5000..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Advanced Parameters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Advanced Parameters
          </button>

          {/* Advanced Parameters Grid */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-2">
                  {/* Trip Length */}
                  <ParamField icon={<Calendar className="w-3 h-3" />} label="Trip Length (days)">
                    <input
                      type="number" min={1} max={90}
                      value={params.tripLengthDays || ''}
                      onChange={e => setParams(p => ({ ...p, tripLengthDays: parseInt(e.target.value) || undefined }))}
                      placeholder="5"
                      className="param-input"
                    />
                  </ParamField>

                  {/* Travel Style */}
                  <ParamField icon={<Sparkles className="w-3 h-3" />} label="Travel Style">
                    <select
                      value={params.travelStyle || ''}
                      onChange={e => setParams(p => ({ ...p, travelStyle: e.target.value as AIItineraryPrompt['travelStyle'] || undefined }))}
                      className="param-input"
                    >
                      <option value="">Auto-detect</option>
                      <option value="luxury">Luxury</option>
                      <option value="mid-range">Mid-Range</option>
                      <option value="budget">Budget</option>
                      <option value="backpacker">Backpacker</option>
                      <option value="business">Business</option>
                      <option value="adventure">Adventure</option>
                      <option value="cultural">Cultural</option>
                      <option value="relaxation">Relaxation</option>
                      <option value="romantic">Romantic</option>
                      <option value="family">Family</option>
                    </select>
                  </ParamField>

                  {/* Budget */}
                  <ParamField icon={<DollarSign className="w-3 h-3" />} label="Max Budget">
                    <input
                      type="number" min={0}
                      value={params.budgetRange?.max || ''}
                      onChange={e => setParams(p => ({
                        ...p,
                        budgetRange: {
                          ...p.budgetRange,
                          max: parseFloat(e.target.value) || undefined,
                          currency: formData.base_currency || 'USD',
                        },
                      }))}
                      placeholder="5000"
                      className="param-input"
                    />
                  </ParamField>

                  {/* Traveler Type */}
                  <ParamField icon={<Users className="w-3 h-3" />} label="Traveler Type">
                    <select
                      value={params.travelerType || ''}
                      onChange={e => setParams(p => ({ ...p, travelerType: e.target.value as AIItineraryPrompt['travelerType'] || undefined }))}
                      className="param-input"
                    >
                      <option value="">Auto-detect</option>
                      <option value="solo">Solo</option>
                      <option value="couple">Couple</option>
                      <option value="family">Family</option>
                      <option value="group">Group</option>
                      <option value="business">Business</option>
                      <option value="honeymoon">Honeymoon</option>
                      <option value="seniors">Seniors</option>
                      <option value="students">Students</option>
                    </select>
                  </ParamField>

                  {/* Num Travelers */}
                  <ParamField icon={<Users className="w-3 h-3" />} label="Travelers">
                    <input
                      type="number" min={1}
                      value={params.numTravelers || ''}
                      onChange={e => setParams(p => ({ ...p, numTravelers: parseInt(e.target.value) || undefined }))}
                      placeholder="2"
                      className="param-input"
                    />
                  </ParamField>

                  {/* Accommodation */}
                  <ParamField icon={<Bed className="w-3 h-3" />} label="Accommodation">
                    <select
                      value={params.accommodationPreference || ''}
                      onChange={e => setParams(p => ({ ...p, accommodationPreference: e.target.value as AIItineraryPrompt['accommodationPreference'] || undefined }))}
                      className="param-input"
                    >
                      <option value="">Any</option>
                      <option value="hotel">Hotel</option>
                      <option value="resort">Resort</option>
                      <option value="boutique">Boutique</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="hostel">Hostel</option>
                    </select>
                  </ParamField>

                  {/* Transport */}
                  <ParamField icon={<Car className="w-3 h-3" />} label="Transportation">
                    <select
                      value={params.transportationPreference || ''}
                      onChange={e => setParams(p => ({ ...p, transportationPreference: e.target.value as AIItineraryPrompt['transportationPreference'] || undefined }))}
                      className="param-input"
                    >
                      <option value="">Any</option>
                      <option value="private_car">Private Car</option>
                      <option value="public_transit">Public Transit</option>
                      <option value="rental_car">Rental Car</option>
                      <option value="taxi">Taxi/Ride-share</option>
                      <option value="walking">Walking</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </ParamField>

                  {/* Food Preference */}
                  <ParamField icon={<Utensils className="w-3 h-3" />} label="Food Preference">
                    <select
                      value={params.foodPreference || ''}
                      onChange={e => setParams(p => ({ ...p, foodPreference: e.target.value as AIItineraryPrompt['foodPreference'] || undefined }))}
                      className="param-input"
                    >
                      <option value="">Any</option>
                      <option value="local_cuisine">Local Cuisine</option>
                      <option value="international">International</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="halal">Halal</option>
                      <option value="kosher">Kosher</option>
                      <option value="gluten_free">Gluten Free</option>
                    </select>
                  </ParamField>

                  {/* Activity Level */}
                  <ParamField icon={<Activity className="w-3 h-3" />} label="Activity Level">
                    <select
                      value={params.activityLevel || ''}
                      onChange={e => setParams(p => ({ ...p, activityLevel: e.target.value as AIItineraryPrompt['activityLevel'] || undefined }))}
                      className="param-input"
                    >
                      <option value="">Auto</option>
                      <option value="relaxed">Relaxed</option>
                      <option value="moderate">Moderate</option>
                      <option value="active">Active</option>
                      <option value="intensive">Intensive</option>
                    </select>
                  </ParamField>

                  {/* Language */}
                  <ParamField icon={<Languages className="w-3 h-3" />} label="Language">
                    <select
                      value={params.language || 'en'}
                      onChange={e => setParams(p => ({ ...p, language: e.target.value }))}
                      className="param-input"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="de">German</option>
                      <option value="tr">Turkish</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </ParamField>

                  {/* Children */}
                  <ParamField icon={<Baby className="w-3 h-3" />} label="Children">
                    <input
                      type="number" min={0}
                      value={params.childrenTraveling?.count ?? ''}
                      onChange={e => setParams(p => ({
                        ...p,
                        childrenTraveling: {
                          count: parseInt(e.target.value) || 0,
                          ages: p.childrenTraveling?.ages,
                        },
                      }))}
                      placeholder="0"
                      className="param-input"
                    />
                  </ParamField>

                  {/* Seniors */}
                  <ParamField icon={<HeartPulse className="w-3 h-3" />} label="Senior Travelers">
                    <input
                      type="number" min={0}
                      value={params.seniorTravelers?.count ?? ''}
                      onChange={e => setParams(p => ({
                        ...p,
                        seniorTravelers: {
                          count: parseInt(e.target.value) || 0,
                          mobilityNotes: p.seniorTravelers?.mobilityNotes,
                        },
                      }))}
                      placeholder="0"
                      className="param-input"
                    />
                  </ParamField>
                </div>

                {/* Text fields in full width */}
                <div className="space-y-3 mt-2">
                  <ParamField icon={<Accessibility className="w-3 h-3" />} label="Accessibility Requirements" fullWidth>
                    <input
                      type="text"
                      value={params.accessibilityRequirements || ''}
                      onChange={e => setParams(p => ({ ...p, accessibilityRequirements: e.target.value }))}
                      placeholder="Wheelchair access, elevator required..."
                      className="param-input"
                    />
                  </ParamField>

                  <ParamField icon={<Globe className="w-3 h-3" />} label="Special Interests" fullWidth>
                    <input
                      type="text"
                      value={(params.specialInterests || []).join(', ')}
                      onChange={e => setParams(p => ({ ...p, specialInterests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      placeholder="Photography, history, scuba diving..."
                      className="param-input"
                    />
                  </ParamField>

                  <ParamField icon={<MapPin className="w-3 h-3" />} label="Special Requests" fullWidth>
                    <textarea
                      value={params.specialRequests || ''}
                      onChange={e => setParams(p => ({ ...p, specialRequests: e.target.value }))}
                      rows={2}
                      placeholder="Anniversary celebration on Day 3, avoid crowds..."
                      className="param-input resize-none"
                    />
                  </ParamField>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {state.currentStep}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Itinerary
                </>
              )}
            </button>
            {isGenerating && (
              <button
                onClick={handleCancel}
                className="px-4 py-3 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {/* Error State */}
          {state.status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 font-medium">Generation failed</p>
              <p className="text-xs text-red-600 mt-1">{state.error}</p>
              <button
                onClick={handleGenerate}
                className="mt-2 text-xs font-semibold text-red-700 hover:text-red-800"
              >
                Try again →
              </button>
            </div>
          )}
        </>
      )}

      {/* Generated Preview */}
      {state.status === 'completed' && state.generatedItinerary && (
        <AIGeneratedPreview
          itinerary={state.generatedItinerary}
          qualityCheck={state.qualityCheck}
          onAccept={handleAccept}
          onReject={() => setState(s => ({
            ...s,
            status: 'idle',
            generatedItinerary: null,
            qualityCheck: null,
            progress: 0,
          }))}
          onRegenerateDay={handleRegenerateDay}
          onRegenerateSlot={handleRegenerateSlot}
          onRefineItem={handleRefineItem}
          onUpdateItem={handleUpdateItem}
          accepting={accepting}
          isRegenerating={isRegenerating}
        />
      )}
    </div>
  )
}

// ── Parameter Field Wrapper ──────────────────────────────────────────────────

function ParamField({
  icon, label, children, fullWidth
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {icon} {label}
      </label>
      {children}
      <style jsx>{`
        :global(.param-input) {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          outline: none;
          transition: all 0.15s;
        }
        :global(.param-input:focus) {
          border-color: #2dd4bf;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.15);
        }
      `}</style>
    </div>
  )
}
