import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wxtiyecrufkwtizsdnpx.supabase.co'
const supabaseKey = 'sb_publishable_9kLQEGEAHNlljmE1FWla6A_KvbS0UTu'
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
