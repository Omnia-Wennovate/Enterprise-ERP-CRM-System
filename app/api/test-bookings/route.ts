import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Test 1: Create a booking
    const newBooking = {
      booking_reference: `BK-${Date.now()}`,
      customer_id: 'cust-001',
      customer_name: 'Test Customer',
      destination: 'Iceland',
      trip_start_date: '2024-06-01',
      trip_end_date: '2024-06-10',
      status: 'pending',
      total_cost: 5000,
      currency: 'USD',
      num_travelers: 2,
      booking_type: 'tour',
      created_by: 'test-user',
    }

    const { data: createdBooking, error: createError } = await supabase
      .from('bookings')
      .insert([newBooking])
      .select()
      .single()

    if (createError) {
      return NextResponse.json({
        success: false,
        error: `Failed to create booking: ${createError.message}`,
      })
    }

    // Test 2: Fetch all bookings
    const { data: allBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch bookings: ${fetchError.message}`,
      })
    }

    return NextResponse.json({
      success: true,
      bookingId: createdBooking?.id,
      allBookings,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
