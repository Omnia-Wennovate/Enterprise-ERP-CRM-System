'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Booking, BookingTraveler, BookingChecklist, BookingTimelineEvent, BookingNote } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface BookingDetailViewProps {
  bookingId: string
  onClose: () => void
}

export function BookingDetailView({ bookingId, onClose }: BookingDetailViewProps) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [travelers, setTravelers] = useState<BookingTraveler[]>([])
  const [checklist, setChecklist] = useState<BookingChecklist[]>([])
  const [timeline, setTimeline] = useState<BookingTimelineEvent[]>([])
  const [notes, setNotes] = useState<BookingNote[]>([])
  const [activeTab, setActiveTab] = useState<'summary' | 'travelers' | 'checklist' | 'timeline' | 'notes'>('summary')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookingDetails()
  }, [bookingId])

  const loadBookingDetails = async () => {
    setLoading(true)
    try {
      const { getBookingById, getTravelers, getChecklist, getTimeline, getBookingNotes } = await import(
        '@/lib/services/bookings'
      )
      const [bookingData, travelersData, checklistData, timelineData, notesData] = await Promise.all([
        getBookingById(bookingId),
        getTravelers(bookingId),
        getChecklist(bookingId),
        getTimeline(bookingId),
        getBookingNotes(bookingId),
      ])

      if (!bookingData) throw new Error('Booking not found')

      setBooking(bookingData)
      setTravelers(travelersData)
      setChecklist(checklistData)
      setTimeline(timelineData)
      setNotes(notesData)
    } catch (err) {
      console.error('[v0] Failed to load booking details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChecklistToggle = async (itemId: string, isCompleted: boolean) => {
    try {
      const { updateChecklistItem } = await import('@/lib/services/bookings')
      
      const updatedItem = await updateChecklistItem(itemId, { is_completed: isCompleted })
      
      // Update local state immediately
      setChecklist((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_completed: isCompleted } : item
        )
      )

      // Reload timeline to show the new event
      const { getTimeline } = await import('@/lib/services/bookings')
      const timelineData = await getTimeline(bookingId)
      setTimeline(timelineData)

      console.log('[v0] Checklist item updated:', itemId)
    } catch (err) {
      console.error('[v0] Failed to update checklist item:', err)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">{booking.booking_reference}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {(['summary', 'travelers', 'checklist', 'timeline', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-teal-600 border-teal-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Customer</p>
                  <p className="text-sm font-medium text-slate-900">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : booking.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Destination</p>
                  <p className="text-sm font-medium text-slate-900">{booking.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Total Cost</p>
                  <p className="text-sm font-medium text-slate-900">{formatCurrency(booking.total_cost)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Start Date</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(booking.trip_start_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">End Date</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(booking.trip_end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {booking.special_requests && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Special Requests</p>
                  <p className="text-sm text-slate-700">{booking.special_requests}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'travelers' && (
            <div className="space-y-4">
              {travelers.length === 0 ? (
                <p className="text-slate-600 text-sm">No travelers added yet</p>
              ) : (
                travelers.map((traveler) => (
                  <div
                    key={traveler.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <p className="font-medium text-slate-900">
                      {traveler.first_name} {traveler.last_name}
                    </p>
                    {traveler.email && (
                      <p className="text-sm text-slate-600">{traveler.email}</p>
                    )}
                    {traveler.passport_number && (
                      <p className="text-sm text-slate-600">Passport: {traveler.passport_number}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-3">
              {checklist.length === 0 ? (
                <p className="text-slate-600 text-sm">No checklist items</p>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={(e) => handleChecklistToggle(item.id, e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${item.is_completed ? 'line-through text-slate-500' : 'text-slate-900'}`}
                      >
                        {item.item_name}
                      </p>
                      {item.due_date && (
                        <p className="text-xs text-slate-500">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-slate-600 text-sm">No timeline events</p>
              ) : (
                timeline.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-4"
                  >
                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{event.event_type}</p>
                      <p className="text-sm text-slate-600">{event.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-slate-600 text-sm">No notes</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <p className="text-sm text-slate-700">{note.note_text}</p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(note.created_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
