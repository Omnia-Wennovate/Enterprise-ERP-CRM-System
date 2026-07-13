'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import type { Booking } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface BookingsTableProps {
  onSelectBooking: (booking: Booking) => void
}

export function BookingsTable({ onSelectBooking }: BookingsTableProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const { getBookings } = await import('@/lib/services/bookings')
      const data = await getBookings()
      setBookings(data)
    } catch (err) {
      console.error('[v0] Failed to load bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-50 text-slate-700 border-slate-200'
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'documents_ready':
        return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'travelled':
        return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm text-slate-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadBookings}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference, customer, or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="documents_ready">Documents Ready</option>
          <option value="travelled">Travelled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-600">No bookings found</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Reference</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Customer</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Destination</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Dates</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => onSelectBooking(booking)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{booking.booking_reference}</td>
                  <td className="px-6 py-4 text-slate-600">{booking.customer_name}</td>
                  <td className="px-6 py-4 text-slate-600">{booking.destination}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {new Date(booking.trip_start_date).toLocaleDateString()} -{' '}
                    {new Date(booking.trip_end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {formatCurrency(booking.total_cost)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
