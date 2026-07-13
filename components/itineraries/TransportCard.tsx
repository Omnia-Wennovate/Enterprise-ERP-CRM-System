'use client'

import { Car, MapPin, Phone, User, Clock } from 'lucide-react'
import type { ItineraryItem, TransportMeta } from '@/types/itinerary'

interface TransportCardProps {
  item: ItineraryItem
}

export function TransportCard({ item }: TransportCardProps) {
  const meta = (item.metadata || {}) as TransportMeta

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Car className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">{item.title}</p>
            {meta.company && <p className="text-amber-100 text-xs">{meta.company}</p>}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
          item.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {item.status}
        </span>
      </div>

      {/* Route */}
      <div className="px-4 py-4 space-y-3">
        {/* Pickup → Dropoff */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-green-200" />
            <div className="w-px h-8 bg-slate-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-red-200" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-green-600 font-medium">Pickup</p>
              <p className="text-sm font-semibold text-slate-800">{meta.pickup_location || item.location || 'TBD'}</p>
              {item.start_time && <p className="text-xs text-slate-500 mt-0.5">{item.start_time}</p>}
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">Drop-off</p>
              <p className="text-sm font-semibold text-slate-800">{meta.dropoff_location || 'TBD'}</p>
              {item.end_time && <p className="text-xs text-slate-500 mt-0.5">{item.end_time}</p>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          {meta.vehicle_type && (
            <div>
              <p className="text-xs text-slate-400">Vehicle</p>
              <p className="text-sm font-medium text-slate-800">{meta.vehicle_type}</p>
            </div>
          )}
          {meta.driver_name && (
            <div>
              <p className="text-xs text-slate-400">Driver</p>
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                <User className="w-3 h-3" /> {meta.driver_name}
              </p>
            </div>
          )}
          {meta.plate_number && (
            <div>
              <p className="text-xs text-slate-400">Plate</p>
              <p className="text-sm font-mono font-bold text-slate-800">{meta.plate_number}</p>
            </div>
          )}
          {meta.driver_phone && (
            <div>
              <p className="text-xs text-slate-400">Phone</p>
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {meta.driver_phone}
              </p>
            </div>
          )}
        </div>

        {/* Meeting Point */}
        {meta.meeting_point && (
          <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
            <p className="text-xs text-blue-800 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> <strong>Meeting Point:</strong> {meta.meeting_point}
            </p>
          </div>
        )}

        {/* Cost */}
        {item.cost > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Cost</span>
            <span className="text-sm font-bold text-slate-900">
              {item.currency} {item.cost.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
