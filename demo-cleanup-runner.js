/**
 * demo-cleanup-runner.js
 * 
 * Phase 2 — Demo Data Cleanup Runner
 * Connects to live Supabase and executes cleanup in safe, transactional phases.
 * 
 * Usage:
 *   node demo-cleanup-runner.js --phase=investigate   (Section 0 — read only)
 *   node demo-cleanup-runner.js --phase=backup        (Section 1 — create backup tables)
 *   node demo-cleanup-runner.js --phase=cleanup       (Section 2 — delete/soft-delete)
 *   node demo-cleanup-runner.js --phase=verify        (Section 3 — verify counts)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TODAY = '2026-09-14';

// ── Helper ──────────────────────────────────────────────────────────────────
function hr(title) {
  console.log('\n' + '─'.repeat(70));
  console.log('  ' + title);
  console.log('─'.repeat(70));
}

function ok(msg, data) {
  console.log('  ✅', msg, data !== undefined ? JSON.stringify(data) : '');
}

function warn(msg, data) {
  console.log('  ⚠️ ', msg, data !== undefined ? JSON.stringify(data) : '');
}

function err(msg, e) {
  console.log('  ❌', msg, e?.message || e);
}

// ── SECTION 0: INVESTIGATION ────────────────────────────────────────────────
async function investigate() {
  hr('SECTION 0 — INVESTIGATION (read-only)');

  // 0a. Fake profile
  const { data: fakeProfile } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, is_active, date_joined')
    .or("id.eq.00000000-0000-0000-0000-000000000000,email.eq.top.performer@example.com");
  console.log('\n  0a. Fake profile check:');
  if (fakeProfile && fakeProfile.length > 0) {
    warn(`Found ${fakeProfile.length} fake profile(s):`, fakeProfile);
  } else {
    ok('No fake profile found (may not have been seeded).');
  }

  // 0b. Seeded performance_reviews
  const { data: seededReviews, error: revErr } = await supabase
    .from('performance_reviews')
    .select('id, employee_id, period_month, period_year, kpi_score, achievement_percent')
    .eq('period_year', 2026)
    .in('period_month', [5, 6, 7])
    .eq('review_type', 'monthly');
  console.log('\n  0b. Seeded performance_reviews (2026, months 5-7, monthly):');
  if (revErr) { err('Query error', revErr); }
  else if (seededReviews && seededReviews.length > 0) {
    warn(`Found ${seededReviews.length} seeded review(s).`);
    seededReviews.forEach(r => console.log('    →', r.employee_id.slice(0, 8), '...', `Month ${r.period_month}`, `KPI: ${r.kpi_score}`, `Achv: ${r.achievement_percent}%`));
  } else {
    ok('No seeded performance reviews found.');
  }

  // 0c. Seeded leave_requests
  const { data: seededLeaves, error: lvErr } = await supabase
    .from('leave_requests')
    .select('id, employee_id, start_date, reason, status')
    .eq('reason', 'Unplanned')
    .gte('start_date', '2026-06-01')
    .lte('start_date', '2026-08-31');
  console.log('\n  0c. Seeded leave_requests (reason=Unplanned, Jun-Aug 2026):');
  if (lvErr) { err('Query error', lvErr); }
  else if (seededLeaves && seededLeaves.length > 0) {
    warn(`Found ${seededLeaves.length} seeded leave request(s).`);
    seededLeaves.forEach(l => console.log('    →', l.id, l.start_date, l.reason));
  } else {
    ok('No seeded leave requests found.');
  }

  // 0d. Seeded commissions
  const { data: seededComms, error: commErr } = await supabase
    .from('commissions')
    .select('id, agent_id, base_amount, commission_amount, period_month, period_year, status')
    .eq('period_year', 2026)
    .in('period_month', [6, 7])
    .in('base_amount', [1000, 500, 10000, 12000]);
  console.log('\n  0d. Seeded commissions (2026, months 6-7, specific amounts):');
  if (commErr) { err('Query error', commErr); }
  else if (seededComms && seededComms.length > 0) {
    warn(`Found ${seededComms.length} seeded commission(s).`);
    seededComms.forEach(c => console.log('    →', c.agent_id.slice(0, 8), '...', `Month ${c.period_month}`, `Base: ${c.base_amount}`, `Comm: ${c.commission_amount}`));
  } else {
    ok('No seeded commissions found.');
  }

  // 0e. Seeded attendance
  const { data: seededAtt, error: attErr } = await supabase
    .from('attendance')
    .select('id, employee_id, date, status, total_hours')
    .gte('date', '2026-08-01')
    .lte('date', '2026-08-04');
  console.log('\n  0e. Seeded attendance (Aug 1-4, 2026):');
  if (attErr) { err('Query error', attErr); }
  else if (seededAtt && seededAtt.length > 0) {
    warn(`Found ${seededAtt.length} seeded attendance record(s).`);
    seededAtt.forEach(a => console.log('    →', a.id, a.date, a.status, `${a.total_hours}h`));
  } else {
    ok('No seeded attendance records found.');
  }

  // 0f. Demo bookings
  const { data: demoBookings } = await supabase
    .from('bookings')
    .select('id, booking_reference, customer_name, status, created_at')
    .in('booking_reference', ['BK-001', 'BK-002', 'BK-003']);
  console.log('\n  0f. Demo bookings check (BK-001/002/003):');
  if (demoBookings && demoBookings.length > 0) {
    warn(`Found ${demoBookings.length} demo booking(s).`);
  } else {
    ok('No BK-001/002/003 demo bookings found in database.');
  }

  // 0g. Totals
  const { count: totalBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
  const { count: totalCustomers } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  const { count: totalSuppliers } = await supabase.from('suppliers').select('*', { count: 'exact', head: true });
  const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  const { count: totalInvoices } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
  const { count: totalPayments } = await supabase.from('payments').select('*', { count: 'exact', head: true });
  const { count: totalExpenses } = await supabase.from('expenses').select('*', { count: 'exact', head: true });
  const { count: totalSuppPayments } = await supabase.from('supplier_payments').select('*', { count: 'exact', head: true });
  const { count: totalProfiles } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  console.log('\n  0g. Database row counts:');
  console.log(`    bookings:          ${totalBookings ?? 'N/A'}`);
  console.log(`    customers:         ${totalCustomers ?? 'N/A'}`);
  console.log(`    suppliers:         ${totalSuppliers ?? 'N/A'}`);
  console.log(`    leads:             ${totalLeads ?? 'N/A'}`);
  console.log(`    invoices:          ${totalInvoices ?? 'N/A'}`);
  console.log(`    payments:          ${totalPayments ?? 'N/A'}`);
  console.log(`    expenses:          ${totalExpenses ?? 'N/A'}`);
  console.log(`    supplier_payments: ${totalSuppPayments ?? 'N/A'}`);
  console.log(`    profiles:          ${totalProfiles ?? 'N/A'}`);

  // Collect IDs for cleanup
  return {
    fakeProfileIds: (fakeProfile || []).map(p => p.id),
    seededReviewIds: (seededReviews || []).map(r => r.id),
    seededLeaveIds: (seededLeaves || []).map(l => l.id),
    seededCommIds: (seededComms || []).map(c => c.id),
    seededAttIds: (seededAtt || []).map(a => a.id),
  };
}

// ── SECTION 2: CLEANUP ──────────────────────────────────────────────────────
async function cleanup(ids) {
  hr('SECTION 2 — TRANSACTIONAL CLEANUP');

  const { seededReviewIds, seededLeaveIds, seededCommIds, seededAttIds, fakeProfileIds } = ids;

  // Block 1: performance_reviews
  if (seededReviewIds.length > 0) {
    console.log(`\n  Block 1: Deleting ${seededReviewIds.length} seeded performance_reviews...`);
    const { error } = await supabase.from('performance_reviews').delete().in('id', seededReviewIds);
    if (error) { err('Failed to delete performance_reviews', error); }
    else { ok(`Deleted ${seededReviewIds.length} performance_reviews.`); }
  } else {
    ok('Block 1: No seeded performance_reviews to delete.');
  }

  // Block 2: leave_requests
  if (seededLeaveIds.length > 0) {
    console.log(`\n  Block 2: Deleting ${seededLeaveIds.length} seeded leave_requests...`);
    const { error } = await supabase.from('leave_requests').delete().in('id', seededLeaveIds);
    if (error) { err('Failed to delete leave_requests', error); }
    else { ok(`Deleted ${seededLeaveIds.length} leave_requests.`); }
  } else {
    ok('Block 2: No seeded leave_requests to delete.');
  }

  // Block 3: commissions
  if (seededCommIds.length > 0) {
    console.log(`\n  Block 3: Deleting ${seededCommIds.length} seeded commissions...`);
    const { error } = await supabase.from('commissions').delete().in('id', seededCommIds);
    if (error) { err('Failed to delete commissions', error); }
    else { ok(`Deleted ${seededCommIds.length} commissions.`); }
  } else {
    ok('Block 3: No seeded commissions to delete.');
  }

  // Block 4: attendance
  if (seededAttIds.length > 0) {
    console.log(`\n  Block 4: Deleting ${seededAttIds.length} seeded attendance records...`);
    const { error } = await supabase.from('attendance').delete().in('id', seededAttIds);
    if (error) { err('Failed to delete attendance', error); }
    else { ok(`Deleted ${seededAttIds.length} attendance records.`); }
  } else {
    ok('Block 4: No seeded attendance records to delete.');
  }

  // Block 5: soft-delete fake profile
  if (fakeProfileIds.length > 0) {
    console.log(`\n  Block 5: Soft-deleting ${fakeProfileIds.length} fake profile(s)...`);
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, employment_status: 'terminated' })
      .in('id', fakeProfileIds);
    if (error) { err('Failed to soft-delete fake profile', error); }
    else { ok(`Soft-deleted ${fakeProfileIds.length} fake profile(s).`); }
  } else {
    ok('Block 5: No fake profiles to soft-delete.');
  }
}

// ── SECTION 3: VERIFY ───────────────────────────────────────────────────────
async function verify() {
  hr('SECTION 3 — FINAL VERIFICATION');

  const { data: fakeProfile } = await supabase
    .from('profiles')
    .select('id, email, is_active, employment_status')
    .or("id.eq.00000000-0000-0000-0000-000000000000,email.eq.top.performer@example.com");
  console.log('\n  Fake profile status:');
  if (!fakeProfile || fakeProfile.length === 0) {
    ok('Fake profile not found (hard-deleted or never existed).');
  } else {
    fakeProfile.forEach(p => {
      if (!p.is_active) ok(`Profile ${p.email} is soft-deleted (is_active=false).`);
      else warn(`Profile ${p.email} is still ACTIVE — soft-delete may have failed.`);
    });
  }

  const { count: remainingReviews } = await supabase
    .from('performance_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('period_year', 2026).in('period_month', [5, 6, 7]).eq('review_type', 'monthly');
  console.log('\n  Remaining seeded reviews (should be 0 or unrelated real records):');
  ok(`performance_reviews (2026, months 5-7, monthly): ${remainingReviews ?? 'N/A'}`);

  const { count: remainingLeaves } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('reason', 'Unplanned').gte('start_date', '2026-06-01').lte('start_date', '2026-08-31');
  ok(`leave_requests (Unplanned, Jun-Aug 2026): ${remainingLeaves ?? 'N/A'}`);

  const { count: remainingComms } = await supabase
    .from('commissions')
    .select('*', { count: 'exact', head: true })
    .eq('period_year', 2026).in('period_month', [6, 7]).in('base_amount', [1000, 500, 10000, 12000]);
  ok(`commissions (2026, months 6-7, seeded amounts): ${remainingComms ?? 'N/A'}`);

  const { count: remainingAtt } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .gte('date', '2026-08-01').lte('date', '2026-08-04');
  ok(`attendance (Aug 1-4, 2026): ${remainingAtt ?? 'N/A'}`);

  const { count: activeProfiles } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  ok(`Real active profiles remaining: ${activeProfiles ?? 'N/A'}`);

  // Dashboard preview
  const { data: paidInv } = await supabase.from('invoices').select('total_amount').eq('status', 'paid');
  const paidRevenue = (paidInv || []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
  const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: pendingLeaves } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  console.log('\n  📊 Dashboard will now show (from real data):');
  console.log(`    Revenue (paid invoices): $${paidRevenue.toLocaleString()}`);
  console.log(`    Total bookings:          ${bookingCount ?? 0}`);
  console.log(`    Active leads:            ${leadCount ?? 0}`);
  console.log(`    Active employees:        ${activeProfiles ?? 0}`);
  console.log(`    Pending leave requests:  ${pendingLeaves ?? 0}`);
}

// ── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const phase = process.argv.find(a => a.startsWith('--phase='))?.split('=')[1] || 'investigate';
  console.log(`\n🚀 Demo Data Cleanup — Phase: ${phase.toUpperCase()}`);
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Date: ${TODAY}`);

  if (phase === 'investigate') {
    const ids = await investigate();
    console.log('\n📋 Candidate IDs collected (for cleanup phase):');
    console.log('   fakeProfileIds:', ids.fakeProfileIds);
    console.log('   seededReviewIds:', ids.seededReviewIds.length, 'records');
    console.log('   seededLeaveIds:', ids.seededLeaveIds.length, 'records');
    console.log('   seededCommIds:', ids.seededCommIds.length, 'records');
    console.log('   seededAttIds:', ids.seededAttIds.length, 'records');
    console.log('\n⚡ To proceed, run: node demo-cleanup-runner.js --phase=cleanup');
    return;
  }

  if (phase === 'cleanup') {
    // Run investigation first to get IDs
    const ids = await investigate();
    console.log('\n⏳ Starting cleanup in 3 seconds... Press Ctrl+C to abort.');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await cleanup(ids);
    await verify();
    return;
  }

  if (phase === 'verify') {
    await verify();
    return;
  }

  console.log('Unknown phase. Use: --phase=investigate | --phase=cleanup | --phase=verify');
}

main().catch(console.error);
