const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema='public'
      AND table_name IN ('profiles','attendance','leave_requests','payroll','performance_reviews','commissions')
      ORDER BY table_name, ordinal_position;
    `
  });

  if (error) {
    console.error('RPC Error:', error.message);
    
    // If RPC fails (likely because execute_sql doesn't exist), we'll do an alternative check
    console.log('Falling back to direct table checks...');
    const tables = ['profiles', 'attendance', 'leave_requests', 'payroll', 'performance_reviews', 'commissions'];
    const results = {};
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase.from(table).select('*').limit(1);
      if (tableError) {
        console.error(`Error fetching ${table}:`, tableError.message);
      } else {
        results[table] = tableData.length > 0 ? Object.keys(tableData[0]) : 'Table exists but is empty, or columns hidden';
      }
    }
    
    fs.writeFileSync('schema-results.json', JSON.stringify(results, null, 2));
    console.log('Schema check complete (fallback). Saved to schema-results.json');
    return;
  }

  console.log('Schema Verification Results:');
  console.log(JSON.stringify(data, null, 2));
  fs.writeFileSync('schema-results.json', JSON.stringify(data, null, 2));
}

verifySchema();
