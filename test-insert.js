import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  const { data, error } = await supabase.from('assets').insert({
    asset_name: 'mac book pro',
    category: 'Laptop',
    brand: 'apple',
    model: 'm3-87',
    serial_number: '838838383',
    purchase_price: 10000,
    department: 'IT',
    condition: 'good',
    status: 'available',
    is_assigned: false,
    quantity: 1,
    available_quantity: 1,
    assigned_quantity: 0
  }).select();

  console.log('Result Data:', data);
  console.log('Result Error:', error);
}

testInsert();
