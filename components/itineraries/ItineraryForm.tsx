'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Itinerary } from '@/types/itinerary'
import { TRAVEL_TYPES } from '@/types/itinerary'

interface ItineraryFormProps {
  itinerary?: Itinerary | null
  onSave: (data: Partial<Itinerary>) => Promise<void>
  onClose: () => void
}

export function ItineraryForm({ itinerary, onSave, onClose }: ItineraryFormProps) {
  const [saving, setSaving] = useState(false)
  const [bookings, setBookings] = useState<{ id: string; booking_reference: string; customer_name: string; destination: string; trip_start_date: string; trip_end_date: string; currency: string }[]>([])
  const [form, setForm] = useState({
    title: itinerary?.title || '',
    booking_id: itinerary?.booking_id || '',
    destination_country: itinerary?.destination_country || '',
    destination_city: itinerary?.destination_city || '',
    travel_type: itinerary?.travel_type || 'leisure',
    base_currency: itinerary?.base_currency || 'USD',
    local_currency: itinerary?.local_currency || '',
    timezone: itinerary?.timezone || 'UTC',
    notes: itinerary?.notes || '',
  })

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const { getAvailableBookings } = await import('@/lib/services/itineraries')
      const data = await getAvailableBookings()
      setBookings(data)
    } catch (err) {
      console.error('Failed to load bookings:', err)
    }
  }

  const handleBookingSelect = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking) {
      setForm(f => ({
        ...f,
        booking_id: bookingId,
        title: f.title || `${booking.destination} Trip`,
        destination_city: f.destination_city || booking.destination,
        base_currency: booking.currency || 'USD',
      }))
    } else {
      setForm(f => ({ ...f, booking_id: bookingId }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({
        ...form,
        booking_id: form.booking_id || null,
        destination_country: form.destination_country || null,
        destination_city: form.destination_city || null,
        local_currency: form.local_currency || null,
        notes: form.notes || null,
      } as Partial<Itinerary>)
    } finally {
      setSaving(false)
    }
  }

  const TIMEZONES = [
    'UTC', 'Asia/Dubai', 'Asia/Riyadh', 'Europe/Istanbul', 'Europe/London',
    'Europe/Paris', 'Europe/Rome', 'America/New_York', 'America/Los_Angeles',
    'Asia/Tokyo', 'Asia/Singapore', 'Asia/Kolkata', 'Africa/Cairo', 'Pacific/Auckland'
  ]

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'TRY', 'JPY', 'INR', 'EGP', 'THB', 'SGD', 'AUD', 'CHF']

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {itinerary ? 'Edit Itinerary' : 'Create New Itinerary'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Booking Link */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Link to Booking
            </label>
            <select
              value={form.booking_id}
              onChange={e => handleBookingSelect(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400"
            >
              <option value="">— No Booking (Standalone) —</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.booking_reference} — {b.customer_name} ({b.destination})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Itinerary Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Classic Dubai 5-Day Adventure"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400"
            />
          </div>

          {/* Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                City
              </label>
              <input
                type="text"
                value={form.destination_city}
                onChange={e => setForm(f => ({ ...f, destination_city: e.target.value }))}
                placeholder="Dubai"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={form.destination_country}
                onChange={e => setForm(f => ({ ...f, destination_country: e.target.value }))}
                placeholder="UAE"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
          </div>

          {/* Travel Type */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Travel Type
            </label>
            <select
              value={form.travel_type}
              onChange={e => setForm(f => ({ ...f, travel_type: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              {TRAVEL_TYPES.map(tt => (
                <option key={tt.value} value={tt.value}>{tt.label}</option>
              ))}
            </select>
          </div>

          {/* Currency & Timezone */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Base Currency
              </label>
              <select
                value={form.base_currency}
                onChange={e => setForm(f => ({ ...f, base_currency: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Local Currency
              </label>
              <select
                value={form.local_currency}
                onChange={e => setForm(f => ({ ...f, local_currency: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                <option value="">Same as base</option>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Internal notes about this itinerary..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {itinerary ? 'Update' : 'Create'} Itinerary
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
