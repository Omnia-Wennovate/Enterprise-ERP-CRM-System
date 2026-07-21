import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

// Load environment variables from .env.local
loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_reference, customer_name, destination, trip_start_date, trip_end_date, num_travelers, currency')
    .limit(1)

  if (error) {
    console.error('Error fetching bookings:', JSON.stringify(error, null, 2))
  } else {
    console.log('Successfully selected bookings:', data)
  }
}

checkSchema()
