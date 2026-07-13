'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ItineraryItem, ActivityType } from '@/types/itinerary'
import { ACTIVITY_TYPES } from '@/types/itinerary'

interface ActivityFormProps {
  item?: ItineraryItem | null
  dayId: string
  sortOrder: number
  onSave: (data: Partial<ItineraryItem>) => Promise<void>
  onClose: () => void
}

export function ActivityForm({ item, dayId, sortOrder, onSave, onClose }: ActivityFormProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: (item?.type || 'custom') as ActivityType,
    title: item?.title || '',
    description: item?.description || '',
    start_time: item?.start_time || item?.time || '',
    end_time: item?.end_time || '',
    duration_minutes: item?.duration_minutes || 0,
    location: item?.location || '',
    address: item?.address || '',
    supplier_name: item?.supplier_name || '',
    booking_reference: item?.booking_reference || '',
    voucher_number: item?.voucher_number || '',
    cost: item?.cost || 0,
    currency: item?.currency || 'USD',
    status: item?.status || 'pending',
    contact_phone: item?.contact_phone || '',
    contact_email: item?.contact_email || '',
    notes: item?.notes || '',
    // Flight-specific
    airline: '',
    flight_number: '',
    departure_code: '',
    arrival_code: '',
    departure_airport: '',
    arrival_airport: '',
    cabin_class: '',
    pnr: '',
    seat: '',
    baggage_allowance: '',
    // Hotel-specific
    hotel_name: '',
    star_rating: 0,
    room_type: '',
    check_in_time: '',
    check_out_time: '',
    breakfast_included: false,
    wifi_included: false,
    confirmation_number: '',
    special_instructions: '',
    // Transport-specific
    vehicle_type: '',
    driver_name: '',
    driver_phone: '',
    plate_number: '',
    pickup_location: '',
    dropoff_location: '',
    meeting_point: '',
    company: '',
  })

  // Populate metadata fields from existing item
  useState(() => {
    if (item?.metadata && typeof item.metadata === 'object') {
      const m = item.metadata as Record<string, unknown>
      setForm(f => ({ ...f, ...Object.fromEntries(
        Object.entries(m).filter(([k]) => k in f)
      ) }))
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    // Build metadata based on type
    let metadata: Record<string, unknown> = {}
    if (form.type === 'flight') {
      metadata = {
        airline: form.airline, flight_number: form.flight_number,
        departure_code: form.departure_code, arrival_code: form.arrival_code,
        departure_airport: form.departure_airport, arrival_airport: form.arrival_airport,
        cabin_class: form.cabin_class, pnr: form.pnr, seat: form.seat,
        baggage_allowance: form.baggage_allowance,
      }
    } else if (form.type === 'hotel') {
      metadata = {
        hotel_name: form.hotel_name || form.title, star_rating: form.star_rating,
        room_type: form.room_type, check_in_time: form.check_in_time,
        check_out_time: form.check_out_time, breakfast_included: form.breakfast_included,
        wifi_included: form.wifi_included, confirmation_number: form.confirmation_number,
        special_instructions: form.special_instructions, address: form.address, phone: form.contact_phone,
      }
    } else if (form.type === 'transfer') {
      metadata = {
        vehicle_type: form.vehicle_type, driver_name: form.driver_name,
        driver_phone: form.driver_phone, plate_number: form.plate_number,
        pickup_location: form.pickup_location, dropoff_location: form.dropoff_location,
        meeting_point: form.meeting_point, company: form.company,
      }
    }

    try {
      await onSave({
        day_id: dayId,
        type: form.type,
        title: form.title,
        description: form.description || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        time: form.start_time || null,
        duration_minutes: form.duration_minutes || null,
        location: form.location || null,
        address: form.address || null,
        supplier_name: form.supplier_name || null,
        booking_reference: form.booking_reference || null,
        voucher_number: form.voucher_number || null,
        cost: form.cost,
        currency: form.currency,
        status: form.status as ItineraryItem['status'],
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        notes: form.notes || null,
        sort_order: sortOrder,
        metadata,
      })
    } finally {
      setSaving(false)
    }
  }

  const typeConfig = ACTIVITY_TYPES.find(t => t.value === form.type)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">
            {item ? 'Edit Activity' : 'Add Activity'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Activity Type */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Activity Type</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {ACTIVITY_TYPES.map(at => (
                <button
                  key={at.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: at.value, title: f.title || at.label }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
                    form.type === at.value
                      ? 'ring-2 ring-teal-500 bg-teal-50 text-teal-700'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${at.color}20` }}>
                    <span style={{ color: at.color }} className="text-[10px]">●</span>
                  </div>
                  <span className="truncate w-full text-center">{at.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Title *</label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={`e.g. ${typeConfig?.label || 'Activity'} name`}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Duration (min)</label>
              <input type="number" value={form.duration_minutes || ''} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
            </div>
          </div>

          {/* ── Flight Fields ── */}
          {form.type === 'flight' && (
            <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-700 uppercase">Flight Details</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Airline" value={form.airline} onChange={v => setForm(f => ({ ...f, airline: v }))} placeholder="Emirates" />
                <Input label="Flight Number" value={form.flight_number} onChange={v => setForm(f => ({ ...f, flight_number: v }))} placeholder="EK101" />
                <Input label="Departure Code" value={form.departure_code} onChange={v => setForm(f => ({ ...f, departure_code: v }))} placeholder="DXB" />
                <Input label="Arrival Code" value={form.arrival_code} onChange={v => setForm(f => ({ ...f, arrival_code: v }))} placeholder="LHR" />
                <Input label="Departure Airport" value={form.departure_airport} onChange={v => setForm(f => ({ ...f, departure_airport: v }))} placeholder="Dubai International" />
                <Input label="Arrival Airport" value={form.arrival_airport} onChange={v => setForm(f => ({ ...f, arrival_airport: v }))} placeholder="London Heathrow" />
                <Input label="Class" value={form.cabin_class} onChange={v => setForm(f => ({ ...f, cabin_class: v }))} placeholder="Business" />
                <Input label="PNR" value={form.pnr} onChange={v => setForm(f => ({ ...f, pnr: v }))} placeholder="ABC123" />
                <Input label="Seat" value={form.seat} onChange={v => setForm(f => ({ ...f, seat: v }))} placeholder="12A" />
                <Input label="Baggage" value={form.baggage_allowance} onChange={v => setForm(f => ({ ...f, baggage_allowance: v }))} placeholder="30kg" />
              </div>
            </div>
          )}

          {/* ── Hotel Fields ── */}
          {form.type === 'hotel' && (
            <div className="space-y-4 p-4 bg-violet-50/50 rounded-xl border border-violet-100">
              <p className="text-xs font-bold text-violet-700 uppercase">Hotel Details</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Hotel Name" value={form.hotel_name} onChange={v => setForm(f => ({ ...f, hotel_name: v }))} placeholder="Burj Al Arab" />
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Star Rating</label>
                  <select value={form.star_rating} onChange={e => setForm(f => ({ ...f, star_rating: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40">
                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? 'Not rated' : `${n} Star`}</option>)}
                  </select>
                </div>
                <Input label="Room Type" value={form.room_type} onChange={v => setForm(f => ({ ...f, room_type: v }))} placeholder="Deluxe Suite" />
                <Input label="Confirmation #" value={form.confirmation_number} onChange={v => setForm(f => ({ ...f, confirmation_number: v }))} placeholder="CONF123" />
                <Input label="Check-in Time" value={form.check_in_time} onChange={v => setForm(f => ({ ...f, check_in_time: v }))} placeholder="15:00" />
                <Input label="Check-out Time" value={form.check_out_time} onChange={v => setForm(f => ({ ...f, check_out_time: v }))} placeholder="12:00" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.breakfast_included} onChange={e => setForm(f => ({ ...f, breakfast_included: e.target.checked }))} className="rounded border-slate-300" />
                  Breakfast Included
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.wifi_included} onChange={e => setForm(f => ({ ...f, wifi_included: e.target.checked }))} className="rounded border-slate-300" />
                  WiFi Included
                </label>
              </div>
              <Input label="Special Instructions" value={form.special_instructions} onChange={v => setForm(f => ({ ...f, special_instructions: v }))} placeholder="Late check-out requested" />
            </div>
          )}

          {/* ── Transfer Fields ── */}
          {form.type === 'transfer' && (
            <div className="space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase">Transfer Details</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Vehicle Type" value={form.vehicle_type} onChange={v => setForm(f => ({ ...f, vehicle_type: v }))} placeholder="Sedan / SUV / Van" />
                <Input label="Company" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="Premium Transfers" />
                <Input label="Driver Name" value={form.driver_name} onChange={v => setForm(f => ({ ...f, driver_name: v }))} placeholder="Ahmed" />
                <Input label="Driver Phone" value={form.driver_phone} onChange={v => setForm(f => ({ ...f, driver_phone: v }))} placeholder="+971..." />
                <Input label="Plate Number" value={form.plate_number} onChange={v => setForm(f => ({ ...f, plate_number: v }))} placeholder="DXB-1234" />
                <Input label="Meeting Point" value={form.meeting_point} onChange={v => setForm(f => ({ ...f, meeting_point: v }))} placeholder="Arrivals Hall Gate 3" />
                <Input label="Pickup Location" value={form.pickup_location} onChange={v => setForm(f => ({ ...f, pickup_location: v }))} placeholder="Hotel lobby" />
                <Input label="Drop-off Location" value={form.dropoff_location} onChange={v => setForm(f => ({ ...f, dropoff_location: v }))} placeholder="Airport Terminal 3" />
              </div>
            </div>
          )}

          {/* Location & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="Location name" />
            <Input label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Full address" />
            <Input label="Supplier" value={form.supplier_name} onChange={v => setForm(f => ({ ...f, supplier_name: v }))} placeholder="Supplier name" />
            <Input label="Booking Ref" value={form.booking_reference} onChange={v => setForm(f => ({ ...f, booking_reference: v }))} placeholder="REF-123" />
            <Input label="Voucher #" value={form.voucher_number} onChange={v => setForm(f => ({ ...f, voucher_number: v }))} placeholder="VOUCH-456" />
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Cost & Contact */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Cost</label>
              <input type="number" step="0.01" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
            </div>
            <Input label="Contact Phone" value={form.contact_phone} onChange={v => setForm(f => ({ ...f, contact_phone: v }))} placeholder="+1..." />
            <Input label="Contact Email" value={form.contact_email} onChange={v => setForm(f => ({ ...f, contact_email: v }))} placeholder="email@..." />
          </div>

          {/* Description & Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none" />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
            <button type="submit" disabled={saving || !form.title.trim()}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? 'Update' : 'Add'} Activity
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
    </div>
  )
}
