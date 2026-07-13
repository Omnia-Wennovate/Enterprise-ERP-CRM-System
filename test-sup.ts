import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const { data, error } = await supabase
    .from('external_training_requests')
    .select(`
      *,
      employee:profiles(id, first_name, last_name, department, position)
    `)
  console.log('Error:', error)
}

test()
