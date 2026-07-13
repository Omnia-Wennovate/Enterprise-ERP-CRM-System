'use client'

import { Building2, Star, Wifi, Coffee, MapPin, Phone, Clock } from 'lucide-react'
import type { ItineraryItem, HotelMeta } from '@/types/itinerary'

interface HotelCardProps {
  item: ItineraryItem
}

export function HotelCard({ item }: HotelCardProps) {
  const meta = (item.metadata || {}) as HotelMeta

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">{meta.hotel_name || item.title}</p>
            <div className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: meta.star_rating || 0 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-300 fill-yellow-300" />
              ))}
            </div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
          item.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {item.status}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-4 space-y-3">
        {/* Room Type */}
        {meta.room_type && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Room Type</span>
            <span className="text-sm font-semibold text-slate-800">{meta.room_type}</span>
          </div>
        )}

        {/* Check-in/out */}
        <div className="flex items-center gap-4">
          {meta.check_in_time && (
            <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-green-600 font-medium">Check-in</p>
              <p className="text-sm font-bold text-green-800">{meta.check_in_time}</p>
            </div>
          )}
          {meta.check_out_time && (
            <div className="flex-1 bg-red-50 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-red-600 font-medium">Check-out</p>
              <p className="text-sm font-bold text-red-800">{meta.check_out_time}</p>
            </div>
          )}
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-3 flex-wrap">
          {meta.breakfast_included && (
            <span className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded-md text-xs font-medium">
              <Coffee className="w-3 h-3" /> Breakfast
            </span>
          )}
          {meta.wifi_included && (
            <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
              <Wifi className="w-3 h-3" /> WiFi
            </span>
          )}
        </div>

        {/* Address & Contact */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          {(meta.address || item.address) && (
            <p className="flex items-start gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {meta.address || item.address}
            </p>
          )}
          {(meta.phone || item.contact_phone) && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="w-3 h-3 flex-shrink-0" />
              {meta.phone || item.contact_phone}
            </p>
          )}
          {meta.confirmation_number && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3 flex-shrink-0" />
              Conf: <span className="font-medium text-slate-700">{meta.confirmation_number}</span>
            </p>
          )}
        </div>

        {/* Special Instructions */}
        {meta.special_instructions && (
          <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> {meta.special_instructions}
            </p>
          </div>
        )}

        {/* Cost */}
        {item.cost > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Total Cost</span>
            <span className="text-sm font-bold text-slate-900">
              {item.currency} {item.cost.toLocaleString()}
              {item.cost_local && item.currency_local && (
                <span className="text-xs text-slate-400 font-normal ml-1">
                  ({item.currency_local} {item.cost_local.toLocaleString()})
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
