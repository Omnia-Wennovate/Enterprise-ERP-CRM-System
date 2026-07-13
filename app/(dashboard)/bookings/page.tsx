'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { BookingsTable } from '@/components/bookings/BookingsTable'
import { BookingDetailView } from '@/components/bookings/BookingDetailView'
import type { Booking } from '@/types'

export default function BookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bookings Management</h1>
            <p className="text-slate-600 mt-1">View and manage all customer bookings</p>
          </div>
          <Link href="/bookings/new" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
            <Plus className="w-5 h-5" />
            New Booking
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <BookingsTable onSelectBooking={setSelectedBooking} />
        </div>
      </div>

      {/* Detail View */}
      {selectedBooking && (
        <BookingDetailView
          bookingId={selectedBooking.id}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}  
