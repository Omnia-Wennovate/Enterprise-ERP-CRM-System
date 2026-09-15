'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Pencil, Save, XCircle } from 'lucide-react'
import type { Booking, BookingTraveler, BookingChecklist, BookingTimelineEvent, BookingNote } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface BookingDetailViewProps {
  bookingId: string
  onClose: () => void
  onUpdate?: () => void
}

export function BookingDetailView({ bookingId, onClose, onUpdate }: BookingDetailViewProps) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [travelers, setTravelers] = useState<BookingTraveler[]>([])
  const [checklist, setChecklist] = useState<BookingChecklist[]>([])
  const [timeline, setTimeline] = useState<BookingTimelineEvent[]>([])
  const [notes, setNotes] = useState<BookingNote[]>([])
  const [activeTab, setActiveTab] = useState<'summary' | 'travelers' | 'checklist' | 'timeline' | 'notes'>('summary')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Booking>>({})

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

  const handleEdit = () => {
    setEditForm({
      customer_name:    booking?.customer_name,
      destination:      booking?.destination,
      trip_start_date:  booking?.trip_start_date?.slice(0, 10),
      trip_end_date:    booking?.trip_end_date?.slice(0, 10),
      total_cost:       booking?.total_cost,
      currency:         booking?.currency || 'USD',
      status:           booking?.status,
      special_requests: booking?.special_requests ?? undefined,
      notes:            booking?.notes ?? undefined,
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      const { updateBooking } = await import('@/lib/services/bookings')
      await updateBooking(bookingId, editForm)
      await loadBookingDetails()
      setIsEditing(false)
      onUpdate?.()
    } catch (err) {
      console.error('[v0] Failed to update booking:', err)
    }
  }

  const handleChecklistToggle = async (itemId: string, isCompleted: boolean) => {
    try {
      const { updateChecklistItem } = await import('@/lib/services/bookings')
      
      await updateChecklistItem(itemId, { is_completed: isCompleted })
      
      setChecklist((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_completed: isCompleted } : item
        )
      )

      const { getTimeline } = await import('@/lib/services/bookings')
      const timelineData = await getTimeline(bookingId)
      setTimeline(timelineData)
    } catch (err) {
      console.error('[v0] Failed to update checklist item:', err)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin text-omnia-gold" />
        </div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-card shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{booking.booking_reference}</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button onClick={handleEdit} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Pencil className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-border">
          {(['summary', 'travelers', 'checklist', 'timeline', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-omnia-gold border-omnia-gold'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Customer Name</label>
                      <input
                        value={editForm.customer_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
                      <select
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Booking['status'] })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {['draft','confirmed','processing','documents_ready','travelled','completed','cancelled'].map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Destination</label>
                      <input
                        value={editForm.destination || ''}
                        onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Total Cost</label>
                      <div className="flex mt-1 gap-2">
                        <select
                          value={editForm.currency || 'USD'}
                          onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                          className="w-1/3 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="USD">USD</option>
                          <option value="ETB">ETB</option>
                        </select>
                        <input
                          type="number"
                          value={editForm.total_cost ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, total_cost: parseFloat(e.target.value) || 0 })}
                          className="w-2/3 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Start Date</label>
                      <input
                        type="date"
                        value={(editForm.trip_start_date as string | undefined) || ''}
                        onChange={(e) => setEditForm({ ...editForm, trip_start_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">End Date</label>
                      <input
                        type="date"
                        value={(editForm.trip_end_date as string | undefined) || ''}
                        onChange={(e) => setEditForm({ ...editForm, trip_end_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Special Requests</label>
                    <textarea
                      rows={2}
                      value={(editForm.special_requests as string | undefined) || ''}
                      onChange={(e) => setEditForm({ ...editForm, special_requests: e.target.value || null })}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Internal Notes</label>
                    <textarea
                      rows={2}
                      value={(editForm.notes as string | undefined) || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value || null })}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={handleSave} className="flex items-center gap-2 bg-omnia-gold text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-omnia-gold-dark transition-colors">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 border border-border px-5 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Customer</p>
                      <p className="text-sm font-medium text-foreground">{booking.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Status</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700'
                        : booking.status === 'draft' ? 'bg-slate-100 text-slate-700'
                        : booking.status === 'cancelled' ? 'bg-red-100 text-red-700'
                        : 'bg-muted text-slate-700'
                      }`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Destination</p>
                      <p className="text-sm font-medium text-foreground">{booking.destination}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Total Cost</p>
                      <p className="text-sm font-medium text-foreground">{formatCurrency(booking.total_cost, booking.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Start Date</p>
                      <p className="text-sm font-medium text-foreground">{new Date(booking.trip_start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">End Date</p>
                      <p className="text-sm font-medium text-foreground">{new Date(booking.trip_end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {booking.special_requests && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Special Requests</p>
                      <p className="text-sm text-slate-700">{booking.special_requests}</p>
                    </div>
                  )}
                  {booking.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Internal Notes</p>
                      <p className="text-sm text-slate-700">{booking.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === 'travelers' && (
            <div className="space-y-4">
              {travelers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No travelers added yet</p>
              ) : travelers.map((traveler) => (
                <div key={traveler.id} className="border border-border rounded-lg p-4">
                  <p className="font-medium text-foreground">{traveler.first_name} {traveler.last_name}</p>
                  {traveler.email && <p className="text-sm text-muted-foreground">{traveler.email}</p>}
                  {traveler.passport_number && <p className="text-sm text-muted-foreground">Passport: {traveler.passport_number}</p>}
                </div>
              ))}
            </div>
          )}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              {checklist.length === 0 ? (
                <p className="text-muted-foreground text-sm">No checklist items</p>
              ) : checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <input type="checkbox" checked={item.is_completed} onChange={(e) => handleChecklistToggle(item.id, e.target.checked)} className="w-5 h-5 cursor-pointer" />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.item_name}</p>
                    {item.due_date && <p className="text-xs text-muted-foreground">Due: {new Date(item.due_date).toLocaleDateString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-muted-foreground text-sm">No timeline events</p>
              ) : timeline.map((event) => (
                <div key={event.id} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-omnia-gold/100 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{event.event_type}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(event.event_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No notes</p>
              ) : notes.map((note) => (
                <div key={note.id} className="border border-border rounded-lg p-4">
                  <p className="text-sm text-slate-700">{note.note_text}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(note.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
