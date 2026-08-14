'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { BookingsTable } from '@/components/bookings/BookingsTable'
import { BookingDetailView } from '@/components/bookings/BookingDetailView'
import type { Booking } from '@/types'

import { Suspense } from 'react'

function BookingsContent() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryBookingId = searchParams.get('id')

  const handleCloseDetail = () => {
    setSelectedBooking(null)
    if (queryBookingId) {
      router.push('/bookings')
    }
  }

  const activeBookingId = selectedBooking?.id || queryBookingId

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bookings Management</h1>
            <p className="text-muted-foreground mt-1">View and manage all customer bookings</p>
          </div>
          <Link href="/bookings/new" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-primary-foreground rounded-lg hover:bg-teal-700 transition-colors font-medium">
            <Plus className="w-5 h-5" />
            New Booking
          </Link>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg shadow">
          <BookingsTable onSelectBooking={setSelectedBooking} />
        </div>
      </div>

      {/* Detail View */}
      {activeBookingId && (
        <BookingDetailView
          bookingId={activeBookingId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading bookings...</div>}>
      <BookingsContent />
    </Suspense>
  )
}
