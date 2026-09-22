import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wxtiyecrufkwtizsdnpx.supabase.co',
  'sb_publishable_9kLQEGEAHNlljmE1FWla6A_KvbS0UTu' // Note: This is an anon key.
)

async function test() {
  // Let's get 1 employee from profiles
  const { data: profile } = await supabase.from('profiles').select('*').limit(1).single()
  console.log('Profile:', profile)

  // Try to create an expense as that user? No, anon key can't insert unless RLS allows anon.
  // We need to bypass RLS to see the records.
  // Wait, do I have the service_role key?
  // Let's check .env
}
test()
