'use client'

import { Globe, Clock, Shield, AlertTriangle, Phone, Landmark, Banknote, ArrowRightLeft } from 'lucide-react'
import type { ItineraryWithBooking } from '@/types/itinerary'

interface TravelIntelligenceProps {
  itinerary: ItineraryWithBooking
}

const ADVISORY_CONFIG = {
  normal: { label: 'Normal', color: 'bg-green-50 text-green-800 border-green-200', icon: Shield, desc: 'Standard travel precautions apply' },
  caution: { label: 'Exercise Caution', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: AlertTriangle, desc: 'Heightened awareness recommended' },
  reconsider: { label: 'Reconsider Travel', color: 'bg-orange-50 text-orange-800 border-orange-200', icon: AlertTriangle, desc: 'Significant risks present' },
  do_not_travel: { label: 'Do Not Travel', color: 'bg-red-50 text-red-800 border-red-200', icon: AlertTriangle, desc: 'Travel is strongly discouraged' },
}

export function TravelIntelligence({ itinerary }: TravelIntelligenceProps) {
  const advisory = ADVISORY_CONFIG[itinerary.travel_advisory_level] || ADVISORY_CONFIG.normal
  const AdvisoryIcon = advisory.icon

  // Compute visa requirement from booking travelers
  // Cross-reference traveler nationality against destination — reusing visa_applications table
  const hasVisaData = itinerary.travelers && itinerary.travelers.length > 0 && itinerary.destination_country

  // Timezone display
  const tz = itinerary.timezone || 'UTC'
  const now = new Date()
  let localTimeStr = ''
  try {
    localTimeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    localTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Globe className="w-4 h-4 text-teal-600" />
        Travel Intelligence
      </h3>

      {/* Travel Advisory Banner */}
      {itinerary.travel_advisory_level && itinerary.travel_advisory_level !== 'normal' && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${advisory.color}`}>
          <AdvisoryIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">{advisory.label}</p>
            <p className="text-xs mt-0.5">{itinerary.travel_advisory_note || advisory.desc}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Timezone */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Local Time</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{localTimeStr}</p>
          <p className="text-xs text-slate-500 mt-0.5">{tz}</p>
          {/* Timezone change detection between days */}
          {itinerary.days && itinerary.days.length > 1 && (
            <div className="mt-2 space-y-1">
              {itinerary.days.map((day, i) => {
                if (i === 0 || !day.timezone || !itinerary.days?.[i-1]?.timezone) return null
                if (day.timezone === itinerary.days[i-1].timezone) return null
                return (
                  <p key={day.id} className="text-xs text-blue-600 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3" />
                    Day {day.day_number}: Timezone changes to {day.timezone}
                  </p>
                )
              })}
            </div>
          )}
        </div>

        {/* Multi-Currency */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Currency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">{itinerary.base_currency}</span>
            {itinerary.local_currency && itinerary.local_currency !== itinerary.base_currency && (
              <>
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-bold text-slate-900">{itinerary.local_currency}</span>
              </>
            )}
          </div>
          {itinerary.exchange_rate && (
            <p className="text-xs text-slate-500 mt-1">
              1 {itinerary.base_currency} = {itinerary.exchange_rate} {itinerary.local_currency}
              {itinerary.exchange_rate_date && (
                <span className="text-slate-400 ml-1">
                  (as of {new Date(itinerary.exchange_rate_date).toLocaleDateString()})
                </span>
              )}
            </p>
          )}
          {/* Total cost in both currencies */}
          {itinerary.total_cost > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">Total Itinerary Cost</p>
              <p className="text-sm font-bold text-slate-900">
                {itinerary.base_currency} {itinerary.total_cost.toLocaleString()}
                {itinerary.exchange_rate && itinerary.local_currency && (
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({itinerary.local_currency} {(itinerary.total_cost * itinerary.exchange_rate).toLocaleString()})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Visa Requirements */}
        {hasVisaData && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase">Visa Requirements</span>
            </div>
            <div className="space-y-2">
              {itinerary.travelers?.map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{t.first_name} {t.last_name}</span>
                  <span className="text-xs text-slate-500">{t.nationality || 'No nationality set'}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-1 italic">
                Cross-reference with visa_applications table for actual requirements per traveler
              </p>
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        {(itinerary.emergency_police || itinerary.emergency_ambulance || itinerary.emergency_embassy) && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase">Emergency Numbers</span>
            </div>
            <div className="space-y-1.5">
              {itinerary.emergency_police && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Police</span>
                  <span className="text-sm font-bold text-slate-900">{itinerary.emergency_police}</span>
                </div>
              )}
              {itinerary.emergency_ambulance && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Ambulance</span>
                  <span className="text-sm font-bold text-slate-900">{itinerary.emergency_ambulance}</span>
                </div>
              )}
              {itinerary.emergency_embassy && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Nearest Embassy</span>
                  <span className="text-sm font-bold text-slate-900">{itinerary.emergency_embassy}</span>
                </div>
              )}
              {itinerary.emergency_embassy_phone && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Embassy Phone</span>
                  <span className="text-sm font-bold text-slate-900">{itinerary.emergency_embassy_phone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
