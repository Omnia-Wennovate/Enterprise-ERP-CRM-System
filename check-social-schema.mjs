import { createClient } from '@supabase/supabase-js';

const url = 'https://wxtiyecrufkwtizsdnpx.supabase.co';
const key = 'sb_publishable_9kLQEGEAHNlljmE1FWla6A_KvbS0UTu';
const supabase = createClient(url, key);

async function checkSchema() {
  // Check social_accounts columns + data
  const { data: accounts, error: accErr } = await supabase
    .from('social_accounts')
    .select('*')
    .limit(5);
  
  console.log('=== social_accounts columns ===');
  if (accounts && accounts.length > 0) {
    console.log('COLUMNS:', Object.keys(accounts[0]).join(', '));
    console.log('DATA:', JSON.stringify(accounts, null, 2));
  } else {
    console.log('No rows found');
  }
  if (accErr) console.log('Error:', accErr.message);

  // Check social_account_metrics  
  const { data: metrics, error: metErr } = await supabase
    .from('social_account_metrics')
    .select('*')
    .limit(3);
  
  console.log('\n=== social_account_metrics ===');
  if (metrics && metrics.length > 0) {
    console.log('COLUMNS:', Object.keys(metrics[0]).join(', '));
  } else {
    console.log('Table exists but has no data (or error)');
  }
  if (metErr) console.log('Error (may not exist yet):', metErr.message);

  // Check social_oauth_states
  const { data: oauth, error: oauthErr } = await supabase
    .from('social_oauth_states')
    .select('id, platform, created_at')
    .limit(3);
  
  console.log('\n=== social_oauth_states ===');
  console.log(JSON.stringify(oauth, null, 2));
  if (oauthErr) console.log('Error (may not exist yet):', oauthErr.message);

  // Check sync_job_log
  const { data: sjl, error: sjlErr } = await supabase
    .from('sync_job_log')
    .select('*')
    .limit(3);
  
  console.log('\n=== sync_job_log ===');
  console.log(JSON.stringify(sjl, null, 2));
  if (sjlErr) console.log('Error (may not exist yet):', sjlErr.message);
}

checkSchema().catch(console.error);
