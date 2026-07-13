'use client'

import { MapPin, Calendar, Users, Clock, ChevronRight, MoreHorizontal, Copy, FileDown, Share2, Archive, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ItineraryWithBooking } from '@/types/itinerary'
import { ITINERARY_STATUSES, TRAVEL_TYPES } from '@/types/itinerary'
import { useState } from 'react'

interface ItineraryCardProps {
  itinerary: ItineraryWithBooking
  onOpen: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  index?: number
}

const DESTINATION_GRADIENTS: Record<string, string> = {
  default: 'from-teal-600 via-sky-600 to-blue-700',
  Dubai: 'from-amber-500 via-orange-500 to-red-600',
  Paris: 'from-blue-500 via-indigo-500 to-violet-600',
  London: 'from-slate-600 via-slate-500 to-slate-700',
  Tokyo: 'from-pink-500 via-rose-500 to-red-500',
  Istanbul: 'from-blue-600 via-teal-600 to-emerald-600',
  Rome: 'from-yellow-600 via-amber-600 to-orange-600',
  Bali: 'from-green-500 via-emerald-500 to-teal-500',
  Maldives: 'from-cyan-400 via-blue-500 to-indigo-600',
  Egypt: 'from-amber-600 via-yellow-600 to-amber-700',
}

function getGradient(destination?: string | null): string {
  if (!destination) return DESTINATION_GRADIENTS.default
  for (const key of Object.keys(DESTINATION_GRADIENTS)) {
    if (destination.toLowerCase().includes(key.toLowerCase())) return DESTINATION_GRADIENTS[key]
  }
  return DESTINATION_GRADIENTS.default
}

export function ItineraryCard({ itinerary, onOpen, onEdit, onDuplicate, onDelete, index = 0 }: ItineraryCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const booking = itinerary.booking
  const statusConfig = ITINERARY_STATUSES.find(s => s.value === itinerary.status)
  const travelTypeLabel = TRAVEL_TYPES.find(t => t.value === itinerary.travel_type)?.label || itinerary.travel_type
  const destination = itinerary.destination_city || itinerary.destination_country || booking?.destination || 'Unknown'
  const gradient = getGradient(destination)

  const startDate = booking?.trip_start_date ? new Date(booking.trip_start_date) : null
  const endDate = booking?.trip_end_date ? new Date(booking.trip_end_date) : null
  const duration = startDate && endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null

  const daysUntil = startDate
    ? Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-white rounded-xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:border-slate-300/60 transition-all duration-300 cursor-pointer"
      onClick={() => onOpen(itinerary.id)}
    >
      {/* Destination Banner */}
      <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }} />

        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                {itinerary.destination_country || 'Destination'}
              </p>
              <h3 className="text-white text-lg font-bold mt-0.5 line-clamp-1">{destination}</h3>
            </div>
            {daysUntil !== null && daysUntil > 0 && (
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                {daysUntil}d away
              </span>
            )}
            {daysUntil !== null && daysUntil === 0 && (
              <span className="px-2.5 py-1 bg-green-400/30 backdrop-blur-sm rounded-full text-xs font-semibold text-white animate-pulse">
                Today!
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        {statusConfig && (
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        )}

        {/* Actions menu */}
        <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20">
              {onEdit && (
                <button onClick={() => { onEdit(itinerary.id); setShowMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {onDuplicate && (
                <button onClick={() => { onDuplicate(itinerary.id); setShowMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
              )}
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <FileDown className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
              <div className="border-t border-slate-100 my-1" />
              {onDelete && (
                <button onClick={() => { onDelete(itinerary.id); setShowMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Title & Booking Ref */}
        <div>
          <h4 className="font-semibold text-slate-900 text-sm line-clamp-1 group-hover:text-teal-700 transition-colors">
            {itinerary.title}
          </h4>
          {booking && (
            <p className="text-xs text-slate-500 mt-0.5">
              {booking.booking_reference} · {booking.customer_name}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {endDate && ` – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {duration} {duration === 1 ? 'Day' : 'Days'}
            </span>
          )}
          {booking && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {booking.num_travelers}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded text-xs text-slate-600 font-medium">
            <MapPin className="w-3 h-3" /> {travelTypeLabel}
          </span>
          <span className="flex items-center gap-1 text-xs text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Open <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  )
}
