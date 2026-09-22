import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function test() {
  const { data, error } = await supabase.from('expenses').select('*')
  console.log('Expenses:', data?.length)
  if (error) console.error(error)
}

test()
