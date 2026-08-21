'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { BookingsTable } from '@/components/bookings/BookingsTable'
import { BookingDetailView } from '@/components/bookings/BookingDetailView'
import { PageHeader } from '@/components/ui/PageHeader'
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
        <PageHeader
          kicker="Operations"
          title="Bookings Management"
          subtitle="View and manage all customer bookings"
          actions={
            <Link href="/bookings/new" className="flex items-center gap-2 px-4 py-2 bg-omnia-gold text-white rounded-lg hover:bg-omnia-gold-dark transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" />
              New Booking
            </Link>
          }
        />

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
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
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading bookings...</div>}>
      <BookingsContent />
    </Suspense>
  )
}
