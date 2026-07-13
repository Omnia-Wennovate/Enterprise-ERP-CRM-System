'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X, Loader2, Map, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ItineraryCard } from './ItineraryCard'
import type { ItineraryWithBooking, ItineraryFilters, ItineraryStatus } from '@/types/itinerary'
import { ITINERARY_STATUSES, TRAVEL_TYPES } from '@/types/itinerary'

interface ItineraryListProps {
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

const QUICK_FILTERS = [
  { label: 'All', value: 'all' as const },
  { label: 'Draft', value: 'draft' as ItineraryStatus },
  { label: 'Planning', value: 'planning' as ItineraryStatus },
  { label: 'Approved', value: 'approved' as ItineraryStatus },
  { label: 'Completed', value: 'completed' as ItineraryStatus },
  { label: 'Cancelled', value: 'cancelled' as ItineraryStatus },
]

export function ItineraryList({ onOpen, onEdit, onCreate, onDelete }: ItineraryListProps) {
  const [itineraries, setItineraries] = useState<ItineraryWithBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ItineraryFilters>({
    search: '',
    status: 'all',
    travelType: 'all',
    country: '',
    dateRange: 'all',
    assignedTo: '',
  })

  useEffect(() => {
    loadItineraries()
  }, [filters.status, filters.travelType])

  const loadItineraries = async () => {
    setLoading(true)
    try {
      const { getItineraries } = await import('@/lib/services/itineraries')
      const data = await getItineraries({
        status: filters.status,
        travelType: filters.travelType,
      })
      setItineraries(data)
    } catch (err) {
      console.error('Failed to load itineraries:', err)
    } finally {
      setLoading(false)
    }
  }

  // Client-side search filter
  const filtered = itineraries.filter(it => {
    if (!filters.search) return true
    const q = filters.search.toLowerCase()
    return (
      it.title.toLowerCase().includes(q) ||
      it.destination_city?.toLowerCase().includes(q) ||
      it.destination_country?.toLowerCase().includes(q) ||
      it.booking?.customer_name?.toLowerCase().includes(q) ||
      it.booking?.booking_reference?.toLowerCase().includes(q)
    )
  })

  const handleDuplicate = async (id: string) => {
    try {
      const { getItineraryById, createItinerary, addDay, addItem } = await import('@/lib/services/itineraries')
      const original = await getItineraryById(id)
      if (!original) return

      const dup = await createItinerary({
        title: `${original.title} (Copy)`,
        booking_id: original.booking_id,
        destination_country: original.destination_country,
        destination_city: original.destination_city,
        timezone: original.timezone,
        travel_type: original.travel_type,
        base_currency: original.base_currency,
        local_currency: original.local_currency,
      })

      if (original.days) {
        for (const day of original.days) {
          const newDay = await addDay(dup.id, day.day_number, day.date || undefined, day.title || undefined)
          if (day.items) {
            for (const item of day.items) {
              await addItem({
                day_id: newDay.id,
                type: item.type,
                time: item.time,
                title: item.title,
                description: item.description,
                sort_order: item.sort_order,
                location: item.location,
                metadata: item.metadata,
              })
            }
          }
        }
      }
      loadItineraries()
    } catch (err) {
      console.error('Failed to duplicate:', err)
    }
  }

  return (
    <div className="space-y-5">
      {/* Search & Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search itineraries, destinations, customers, booking references..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 text-sm transition-all"
          />
          {filters.search && (
            <button onClick={() => setFilters(f => ({ ...f, search: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
        <button onClick={onCreate} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> New Itinerary
        </button>
      </div>

      {/* Quick Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_FILTERS.map(qf => (
          <button
            key={qf.value}
            onClick={() => setFilters(f => ({ ...f, status: qf.value as any }))}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filters.status === qf.value
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-1.5 block">Travel Type</label>
                <select
                  value={filters.travelType}
                  onChange={e => setFilters(f => ({ ...f, travelType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                >
                  <option value="all">All Types</option>
                  {TRAVEL_TYPES.map(tt => (
                    <option key={tt.value} value={tt.value}>{tt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-1.5 block">Country</label>
                <input
                  type="text"
                  placeholder="e.g. UAE, France..."
                  value={filters.country}
                  onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </div>
              <div className="col-span-2 flex items-end">
                <button
                  onClick={() => setFilters({ search: '', status: 'all', travelType: 'all', country: '', dateRange: 'all', assignedTo: '' })}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200/60">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
            <Map className="w-8 h-8 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No Itineraries Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
            {filters.search || filters.status !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first itinerary to get started with trip planning'}
          </p>
          <button onClick={onCreate} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold">
            <Plus className="w-4 h-4" /> Create Itinerary
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((it, i) => (
            <ItineraryCard
              key={it.id}
              itinerary={it}
              onOpen={onOpen}
              onEdit={onEdit}
              onDuplicate={handleDuplicate}
              onDelete={onDelete}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Showing {filtered.length} itinerar{filtered.length === 1 ? 'y' : 'ies'}
        </p>
      )}
    </div>
  )
}
