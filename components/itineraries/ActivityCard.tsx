'use client'

import {
  Plane, Building2, Car, TrainFront, Ship, UtensilsCrossed, Camera,
  Stamp, FileText, Users, Heart, Church, PartyPopper, ShoppingBag,
  Coffee, Sparkles, Clock, MapPin, Phone, Mail, GripVertical,
  Pencil, Trash2, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlightCard } from './FlightCard'
import { HotelCard } from './HotelCard'
import { TransportCard } from './TransportCard'
import type { ItineraryItem, ActivityType } from '@/types/itinerary'
import { ACTIVITY_TYPES } from '@/types/itinerary'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Plane, Building2, Car, TrainFront, Ship, UtensilsCrossed, Camera,
  Stamp, FileText, Users, Heart, Church, PartyPopper, ShoppingBag,
  Coffee, Sparkles,
}

interface ActivityCardProps {
  item: ItineraryItem
  onEdit?: (item: ItineraryItem) => void
  onDelete?: (id: string) => void
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
}

export function ActivityCard({ item, onEdit, onDelete, dragHandleProps, isDragging }: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false)

  // For specialized types, render their premium card
  if (item.type === 'flight') return <div className={isDragging ? 'opacity-60' : ''}><FlightCard item={item} /></div>
  if (item.type === 'hotel') return <div className={isDragging ? 'opacity-60' : ''}><HotelCard item={item} /></div>
  if (item.type === 'transfer') return <div className={isDragging ? 'opacity-60' : ''}><TransportCard item={item} /></div>

  const typeConfig = ACTIVITY_TYPES.find(t => t.value === item.type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1]
  const IconComp = ICONS[typeConfig.icon] || Sparkles

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-50 text-green-700',
    pending: 'bg-amber-50 text-amber-700',
    cancelled: 'bg-red-50 text-red-700',
    completed: 'bg-teal-50 text-teal-700',
  }

  return (
    <motion.div
      layout
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 ${isDragging ? 'opacity-60 shadow-2xl ring-2 ring-teal-400' : ''}`}
    >
      {/* Compact View */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag Handle */}
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-300 hover:text-slate-500">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Icon */}
        <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${typeConfig.color}15` }}>
          <IconComp className="w-4 h-4" style={{ color: typeConfig.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{item.title}</h4>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusColors[item.status] || statusColors.pending}`}>
              {item.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            {(item.time || item.start_time) && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {item.start_time || item.time}
                {item.end_time && ` – ${item.end_time}`}
              </span>
            )}
            {item.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" /> {item.location}
              </span>
            )}
            {item.cost > 0 && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> {item.currency} {item.cost.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(item) }} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(item.id) }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
              {item.description && (
                <p className="text-sm text-slate-600">{item.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {item.supplier_name && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Supplier</p>
                    <p className="text-sm font-medium text-slate-700">{item.supplier_name}</p>
                  </div>
                )}
                {item.booking_reference && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Booking Ref</p>
                    <p className="text-sm font-medium text-slate-700">{item.booking_reference}</p>
                  </div>
                )}
                {item.voucher_number && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Voucher</p>
                    <p className="text-sm font-medium text-slate-700">{item.voucher_number}</p>
                  </div>
                )}
                {item.duration_minutes && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Duration</p>
                    <p className="text-sm font-medium text-slate-700">{item.duration_minutes} min</p>
                  </div>
                )}
              </div>

              {/* Contact */}
              {(item.contact_phone || item.contact_email) && (
                <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                  {item.contact_phone && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="w-3 h-3" /> {item.contact_phone}
                    </span>
                  )}
                  {item.contact_email && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Mail className="w-3 h-3" /> {item.contact_email}
                    </span>
                  )}
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-600">{item.notes}</p>
                </div>
              )}

              {/* Multi-currency */}
              {item.cost > 0 && item.cost_local && item.currency_local && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Cost ({item.currency})</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{item.currency} {item.cost.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{item.currency_local} {item.cost_local.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
