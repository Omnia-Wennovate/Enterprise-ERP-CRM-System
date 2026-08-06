import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function preflight() {
  // 1. Check if assets table exists and its columns
  const { data: assetsData, error: assetsError } = await supabase.from('assets').select('*').limit(1);
  console.log('=== ASSETS TABLE ===');
  console.log('Data:', assetsData);
  console.log('Error:', assetsError);

  // 2. Check if asset_assignments table exists
  const { data: assignData, error: assignError } = await supabase.from('asset_assignments').select('*').limit(1);
  console.log('\n=== ASSET_ASSIGNMENTS TABLE ===');
  console.log('Data:', assignData);
  console.log('Error:', assignError);

  // 3. Check if employees table exists (separate from profiles)
  const { data: empData, error: empError } = await supabase.from('employees').select('*').limit(1);
  console.log('\n=== EMPLOYEES TABLE ===');
  console.log('Data:', empData);
  console.log('Error:', empError);

  // 4. Check profiles table columns
  const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
  console.log('\n=== PROFILES TABLE ===');
  console.log('Data:', JSON.stringify(profilesData, null, 2));
  console.log('Error:', profilesError);

  // 5. Check hr_audit_log table
  const { data: auditData, error: auditError } = await supabase.from('hr_audit_log').select('*').limit(1);
  console.log('\n=== HR_AUDIT_LOG TABLE ===');
  console.log('Data:', auditData);
  console.log('Error:', auditError);

  // 6. Try inserting a test asset to see which columns are accepted
  console.log('\n=== TESTING ASSET INSERT COLUMNS ===');
  let testPayload = {
    asset_type: 'test',
    asset_name: 'test',
    serial_number: 'test',
    condition: 'good',
    is_assigned: false,
    // New columns we want to add:
    asset_code: 'test',
    barcode: 'test',
    brand: 'test',
    model: 'test',
    category: 'test',
    purchase_date: '2026-01-01',
    purchase_price: 1000,
    supplier: 'test',
    warranty_expiry: '2027-01-01',
    department: 'test',
    current_location: 'test',
    status: 'available',
    quantity: 1,
    available_quantity: 1,
    assigned_quantity: 0,
    notes: 'test',
    qr_code: 'test',
  };

  while (Object.keys(testPayload).length > 0) {
    const { data, error } = await supabase.from('assets').insert(testPayload).select('id').single();
    if (error) {
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match) {
        console.log(`Column '${match[1]}' does NOT exist in assets table`);
        delete testPayload[match[1]];
      } else {
        console.log('Insert result:', { data, error });
        break;
      }
    } else {
      console.log('SUCCESS! Accepted columns:', Object.keys(testPayload));
      // Clean up test record
      if (data?.id) await supabase.from('assets').delete().eq('id', data.id);
      break;
    }
  }
}

preflight();
