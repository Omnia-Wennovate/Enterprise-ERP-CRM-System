'use client'

import { Plane, ArrowRight } from 'lucide-react'
import type { ItineraryItem, FlightMeta } from '@/types/itinerary'

interface FlightCardProps {
  item: ItineraryItem
}

export function FlightCard({ item }: FlightCardProps) {
  const meta = (item.metadata || {}) as FlightMeta

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-teal-50 text-teal-700 border-teal-200',
  }

  /* Flight status badge — scaffold for future live API integration.
   * A future Edge Function calling AviationStack or FlightAware would
   * write into item.flight_status via Supabase, and the UI here would
   * automatically reflect the update. */
  const flightStatusColors: Record<string, string> = {
    'on-time': 'bg-green-100 text-green-800',
    'delayed': 'bg-red-100 text-red-800',
    'boarding': 'bg-blue-100 text-blue-800',
    'departed': 'bg-indigo-100 text-indigo-800',
    'landed': 'bg-emerald-100 text-emerald-800',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">{meta.airline || 'Airline'}</p>
            <p className="text-blue-100 text-xs">{meta.flight_number || item.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.flight_status && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${flightStatusColors[item.flight_status] || 'bg-slate-100 text-slate-700'}`}>
              {item.flight_status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[item.status] || statusColors.pending}`}>
            {item.status}
          </span>
        </div>
      </div>

      {/* Flight Route */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Departure */}
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-slate-900">{meta.departure_code || '---'}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{meta.departure_airport || 'Departure'}</p>
            {item.start_time && <p className="text-sm font-semibold text-slate-800 mt-1">{item.start_time}</p>}
            {meta.departure_terminal && <p className="text-xs text-slate-400">Terminal {meta.departure_terminal}</p>}
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center px-4">
            <div className="flex items-center gap-1">
              <div className="h-px w-8 bg-slate-300" />
              <Plane className="w-4 h-4 text-blue-500 rotate-90" />
              <div className="h-px w-8 bg-slate-300" />
            </div>
            {item.duration_minutes && (
              <p className="text-xs text-slate-400 mt-1">
                {Math.floor(item.duration_minutes / 60)}h {item.duration_minutes % 60}m
              </p>
            )}
          </div>

          {/* Arrival */}
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-slate-900">{meta.arrival_code || '---'}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{meta.arrival_airport || 'Arrival'}</p>
            {item.end_time && <p className="text-sm font-semibold text-slate-800 mt-1">{item.end_time}</p>}
            {meta.arrival_terminal && <p className="text-xs text-slate-400">Terminal {meta.arrival_terminal}</p>}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
          {meta.cabin_class && (
            <DetailItem label="Class" value={meta.cabin_class} />
          )}
          {meta.seat && (
            <DetailItem label="Seat" value={meta.seat} />
          )}
          {meta.pnr && (
            <DetailItem label="PNR" value={meta.pnr} />
          )}
          {meta.baggage_allowance && (
            <DetailItem label="Baggage" value={meta.baggage_allowance} />
          )}
          {item.booking_reference && (
            <DetailItem label="Booking Ref" value={item.booking_reference} />
          )}
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}
