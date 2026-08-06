const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  if (pErr || !profiles || profiles.length === 0) {
    console.log('No profiles found to seed.');
    return;
  }

  const employee = profiles[0];
  const employeeId = employee.id;

  console.log(`Seeding data for employee: ${employee.first_name || employee.email}`);

  // 1. Performance Reviews (Declining trend)
  const reviews = [
    { employee_id: employeeId, period_month: 5, period_year: 2026, kpi_score: 85, target_score: 90, achievement_percent: 94, review_type: 'monthly', status: 'submitted' },
    { employee_id: employeeId, period_month: 6, period_year: 2026, kpi_score: 75, target_score: 90, achievement_percent: 83, review_type: 'monthly', status: 'submitted' },
    { employee_id: employeeId, period_month: 7, period_year: 2026, kpi_score: 60, target_score: 90, achievement_percent: 66, review_type: 'monthly', status: 'submitted' },
  ];
  await supabase.from('performance_reviews').upsert(reviews);
  console.log('Inserted performance reviews.');

  // 2. Leave Types & Requests (Increased unplanned leave)
  const { data: leaveTypes } = await supabase.from('leave_types').select('*').eq('name', 'Sick Leave').limit(1);
  if (leaveTypes && leaveTypes.length > 0) {
    const sickLeaveId = leaveTypes[0].id;
    const leaveRequests = [
      { employee_id: employeeId, leave_type_id: sickLeaveId, start_date: '2026-06-10', end_date: '2026-06-11', days_requested: 2, status: 'hr_approved', reason: 'Unplanned' },
      { employee_id: employeeId, leave_type_id: sickLeaveId, start_date: '2026-07-05', end_date: '2026-07-06', days_requested: 2, status: 'hr_approved', reason: 'Unplanned' },
      { employee_id: employeeId, leave_type_id: sickLeaveId, start_date: '2026-07-20', end_date: '2026-07-22', days_requested: 3, status: 'hr_approved', reason: 'Unplanned' },
    ];
    await supabase.from('leave_requests').upsert(leaveRequests);
    console.log('Inserted leave requests.');
  } else {
    console.log('Sick leave type not found.');
  }

  // 3. Commissions (Below average)
  const rules = await supabase.from('commission_rules').select('*').limit(1);
  let ruleId = rules.data?.[0]?.id;
  if (!ruleId) {
     const res = await supabase.from('commission_rules').insert({ role: 'sales_agent', rule_type: 'percentage', rate: 10, applies_to: 'revenue' }).select();
     ruleId = res.data[0].id;
  }

  // Create a booking if needed to link commission, or just insert commission directly if booking_id isn't strictly enforced
  // Looking at phase-5-hr-schema, commissions aren't defined there. Wait, commissions are from finance phase.
  const commissions = [
    { agent_id: employeeId, rule_id: ruleId, base_amount: 1000, commission_amount: 100, period_month: 6, period_year: 2026, status: 'approved' },
    { agent_id: employeeId, rule_id: ruleId, base_amount: 500, commission_amount: 50, period_month: 7, period_year: 2026, status: 'approved' }
  ];
  const { error: cErr } = await supabase.from('commissions').upsert(commissions);
  if (cErr) console.error('Error inserting commissions:', cErr.message);
  else console.log('Inserted commissions.');

  // Ensure employee tenure is > 18 months for the "no promotion" check
  await supabase.from('profiles').update({ date_joined: '2024-01-15' }).eq('id', employeeId);
  console.log('Updated employee tenure.');

  // Also seed some attendance records
  const attendance = [
    { employee_id: employeeId, date: '2026-08-01', status: 'present', total_hours: 8 },
    { employee_id: employeeId, date: '2026-08-02', status: 'late', total_hours: 7, late_minutes: 30 },
    { employee_id: employeeId, date: '2026-08-03', status: 'absent', total_hours: 0 },
    { employee_id: employeeId, date: '2026-08-04', status: 'present', total_hours: 8 },
  ];
  await supabase.from('attendance').upsert(attendance);
  console.log('Inserted attendance.');
  
  // Seed another employee to ensure average comparisons work
  if (profiles.length === 1) {
    const { data: newProfile, error: npErr } = await supabase.from('profiles').insert({
       id: '00000000-0000-0000-0000-000000000000',
       email: 'top.performer@example.com',
       first_name: 'Top',
       last_name: 'Performer',
       department: employee.department || 'Sales',
       is_active: true,
       basic_salary: 8000,
       date_joined: '2025-01-01',
       gender: 'Female'
    }).select();
    if (!npErr && newProfile && newProfile.length > 0) {
       const newEmpId = newProfile[0].id;
       await supabase.from('performance_reviews').upsert([
          { employee_id: newEmpId, period_month: 5, period_year: 2026, kpi_score: 95, target_score: 90, achievement_percent: 105, review_type: 'monthly', status: 'submitted' },
          { employee_id: newEmpId, period_month: 6, period_year: 2026, kpi_score: 96, target_score: 90, achievement_percent: 106, review_type: 'monthly', status: 'submitted' },
          { employee_id: newEmpId, period_month: 7, period_year: 2026, kpi_score: 98, target_score: 90, achievement_percent: 108, review_type: 'monthly', status: 'submitted' }
       ]);
       await supabase.from('commissions').upsert([
          { agent_id: newEmpId, rule_id: ruleId, base_amount: 10000, commission_amount: 1000, period_month: 6, period_year: 2026, status: 'approved' },
          { agent_id: newEmpId, rule_id: ruleId, base_amount: 12000, commission_amount: 1200, period_month: 7, period_year: 2026, status: 'approved' }
       ]);
       console.log('Seeded top performer employee data.');
    }
  }

  console.log('Seed completed successfully.');
}

seedData();
