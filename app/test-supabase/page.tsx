'use client'

import { useState } from 'react'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Initializing...')
  const [bookings, setBookings] = useState<any[]>([])

  const testConnection = async () => {
    try {
      setStatus('Testing Supabase connection...')

      // Try to create a booking
      const response = await fetch('/api/test-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (result.success) {
        setStatus(`Success! Created booking: ${result.bookingId}`)
        setBookings(result.allBookings || [])
      } else {
        setStatus(`Error: ${result.error}`)
      }
    } catch (err) {
      setStatus(`Connection failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA] p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

        <button
          onClick={testConnection}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 mb-4"
        >
          Test Connection & Insert Demo Data
        </button>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-900">{status}</p>
        </div>

        {bookings.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-bold">Bookings in Database:</h2>
            {bookings.map((booking: any) => (
              <div key={booking.id} className="p-2 bg-slate-50 border border-slate-200 rounded">
                <p className="font-medium">{booking.booking_reference}</p>
                <p className="text-sm text-slate-600">Customer: {booking.customer_name}</p>
                <p className="text-sm text-slate-600">Destination: {booking.destination}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
