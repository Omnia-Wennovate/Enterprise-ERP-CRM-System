import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testInsert() {
  const expenseNumber = 'EXP-TEST-001'
  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        expense_number: expenseNumber,
        category: 'Test',
        description: 'Test expense',
        amount: 100,
        expense_date: new Date().toISOString(),
        department: 'Test Department',
        submission_source: 'department',
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Insert Error:', error.message)
  } else {
    console.log('Inserted:', data.id)
    
    // Now try to select it
    const { data: selData, error: selError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', data.id)
      .single()
      
    if (selError) {
      console.error('Select Error:', selError.message)
    } else {
      console.log('Selected successfully:', selData.id)
    }
  }
}
testInsert()
