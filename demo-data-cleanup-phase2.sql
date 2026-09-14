-- ============================================================================
-- OMNIA ERP — Demo Data Cleanup
-- Date: 2026-09-14
-- Phase 2: Database cleanup script
--
-- INSTRUCTIONS:
-- 1. Run SECTION 0 first (investigation queries) — review the output
-- 2. Run SECTION 1 (backup tables) — confirm backup tables were created
-- 3. Run SECTION 2 (transactional cleanup) — one block at a time
-- 4. Run SECTION 3 (verification) — confirm row counts
--
-- IMPORTANT: Run each BEGIN...COMMIT block individually.
-- If any verification SELECT returns unexpected counts, use ROLLBACK.
-- ============================================================================

-- ============================================================================
-- SECTION 0: INVESTIGATION — RUN FIRST, REVIEW OUTPUT, DO NOT SKIP
-- ============================================================================

-- 0a. Check for the fake profile
SELECT id, email, first_name, last_name, is_active, date_joined
FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000000'
   OR email = 'top.performer@example.com';

-- 0b. Count seeded performance_reviews (months 5,6,7 of 2026 — seed patterns)
-- These were inserted by seed-hr-data.js for BOTH the fake profile and the first real profile
SELECT
  pr.id,
  pr.employee_id,
  p.email,
  pr.period_month,
  pr.period_year,
  pr.kpi_score,
  pr.achievement_percent,
  pr.review_type,
  pr.status
FROM performance_reviews pr
JOIN profiles p ON p.id = pr.employee_id
WHERE pr.period_year = 2026
  AND pr.period_month IN (5, 6, 7)
  AND pr.review_type = 'monthly'
ORDER BY p.email, pr.period_month;

-- 0c. Count seeded leave_requests (inserted by seed-hr-data.js)
SELECT
  lr.id,
  lr.employee_id,
  p.email,
  lr.start_date,
  lr.end_date,
  lr.reason,
  lr.status
FROM leave_requests lr
JOIN profiles p ON p.id = lr.employee_id
WHERE lr.reason = 'Unplanned'
  AND lr.start_date BETWEEN '2026-06-01' AND '2026-08-31';

-- 0d. Count seeded commissions (inserted by seed-hr-data.js)
SELECT
  c.id,
  c.agent_id,
  p.email,
  c.base_amount,
  c.commission_amount,
  c.period_month,
  c.period_year,
  c.status
FROM commissions c
JOIN profiles p ON p.id = c.agent_id
WHERE c.period_year = 2026
  AND c.period_month IN (6, 7)
  AND c.base_amount IN (1000, 500, 10000, 12000)
ORDER BY p.email, c.period_month;

-- 0e. Count seeded attendance records (inserted by seed-hr-data.js)
SELECT
  a.id,
  a.employee_id,
  p.email,
  a.date,
  a.status,
  a.total_hours
FROM attendance a
JOIN profiles p ON p.id = a.employee_id
WHERE a.date BETWEEN '2026-08-01' AND '2026-08-04';

-- 0f. Check for any bookings that look like demo data (BK-001, BK-002, BK-003 pattern)
-- Note: customer_id is UUID — 'CUST-001' strings were only used as JS mock keys, never stored in DB
SELECT id, booking_reference, customer_name, destination, status, created_at
FROM bookings
WHERE booking_reference IN ('BK-001', 'BK-002', 'BK-003')
   OR booking_reference ILIKE 'BK-00%'
   OR customer_name ILIKE '%demo%'
   OR customer_name ILIKE '%test%'
   OR customer_name ILIKE '%sample%';

-- 0g. Check all bookings for context (total count + oldest records)
SELECT
  COUNT(*) AS total_bookings,
  MIN(created_at) AS oldest_booking,
  MAX(created_at) AS newest_booking
FROM bookings;

-- 0h. Check customers table
SELECT COUNT(*) AS total_customers FROM customers;
SELECT id, company_name, email, created_at, is_active FROM customers ORDER BY created_at ASC LIMIT 10;

-- 0i. Check suppliers table
SELECT COUNT(*) AS total_suppliers FROM suppliers;
SELECT id, name, category, created_at, is_active FROM suppliers ORDER BY created_at ASC LIMIT 10;

-- 0j. Check leads table
SELECT COUNT(*) AS total_leads FROM leads;
SELECT id, lead_name, email, status, pipeline_stage, created_at FROM leads ORDER BY created_at ASC LIMIT 10;

-- 0k. Check invoices, payments, expenses, supplier_payments
SELECT COUNT(*) AS total_invoices FROM invoices;
SELECT COUNT(*) AS total_payments FROM payments;
SELECT COUNT(*) AS total_expenses FROM expenses;
SELECT COUNT(*) AS total_supplier_payments FROM supplier_payments;

-- 0l. Check commission_rules
SELECT id, role, rule_type, rate, applies_to, is_active FROM commission_rules;

-- ============================================================================
-- SECTION 1: CREATE BACKUP TABLES — RUN AFTER REVIEWING SECTION 0
-- ============================================================================
-- These backup tables are permanent — do NOT drop them. Review and clean up
-- weeks later when you are satisfied nothing needs to be restored.

-- Backup fake profile
CREATE TABLE IF NOT EXISTS demo_cleanup_backup_profiles_20260914 AS
SELECT * FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000000'
   OR email = 'top.performer@example.com';

SELECT COUNT(*) AS backed_up_profiles FROM demo_cleanup_backup_profiles_20260914;

-- Backup seeded performance_reviews
CREATE TABLE IF NOT EXISTS demo_cleanup_backup_performance_reviews_20260914 AS
SELECT pr.*
FROM performance_reviews pr
WHERE pr.period_year = 2026
  AND pr.period_month IN (5, 6, 7)
  AND pr.review_type = 'monthly'
  AND (
    pr.employee_id = '00000000-0000-0000-0000-000000000000'
    OR pr.employee_id IN (
      SELECT employee_id FROM performance_reviews
      WHERE period_year = 2026 AND period_month IN (5, 6, 7)
        AND review_type = 'monthly'
        AND kpi_score IN (85, 75, 60, 95, 96, 98)
        AND target_score = 90
    )
  );

SELECT COUNT(*) AS backed_up_performance_reviews FROM demo_cleanup_backup_performance_reviews_20260914;

-- Backup seeded leave_requests
CREATE TABLE IF NOT EXISTS demo_cleanup_backup_leave_requests_20260914 AS
SELECT lr.*
FROM leave_requests lr
WHERE lr.reason = 'Unplanned'
  AND lr.start_date BETWEEN '2026-06-01' AND '2026-08-31';

SELECT COUNT(*) AS backed_up_leave_requests FROM demo_cleanup_backup_leave_requests_20260914;

-- Backup seeded commissions
CREATE TABLE IF NOT EXISTS demo_cleanup_backup_commissions_20260914 AS
SELECT c.*
FROM commissions c
WHERE c.period_year = 2026
  AND c.period_month IN (6, 7)
  AND c.base_amount IN (1000, 500, 10000, 12000);

SELECT COUNT(*) AS backed_up_commissions FROM demo_cleanup_backup_commissions_20260914;

-- Backup seeded attendance
CREATE TABLE IF NOT EXISTS demo_cleanup_backup_attendance_20260914 AS
SELECT a.*
FROM attendance a
WHERE a.date BETWEEN '2026-08-01' AND '2026-08-04';

SELECT COUNT(*) AS backed_up_attendance FROM demo_cleanup_backup_attendance_20260914;

-- ============================================================================
-- SECTION 2: TRANSACTIONAL CLEANUP — RUN ONE BLOCK AT A TIME
-- ============================================================================

-- ── BLOCK 1: Delete seeded performance_reviews ──────────────────────────────
BEGIN;

  -- Count before
  SELECT COUNT(*) AS before_count FROM performance_reviews
  WHERE period_year = 2026
    AND period_month IN (5, 6, 7)
    AND review_type = 'monthly'
    AND kpi_score IN (85, 75, 60, 95, 96, 98)
    AND target_score = 90;

  -- Delete seeded reviews for BOTH the fake profile and real profile's seeded reviews
  DELETE FROM performance_reviews
  WHERE id IN (
    SELECT id FROM demo_cleanup_backup_performance_reviews_20260914
  );

  -- Verify
  SELECT COUNT(*) AS after_count FROM performance_reviews
  WHERE period_year = 2026
    AND period_month IN (5, 6, 7)
    AND review_type = 'monthly'
    AND kpi_score IN (85, 75, 60, 95, 96, 98)
    AND target_score = 90;
  -- Expected: 0. If > 0, ROLLBACK and investigate.

COMMIT;


-- ── BLOCK 2: Delete seeded leave_requests ───────────────────────────────────
BEGIN;

  SELECT COUNT(*) AS before_count FROM leave_requests
  WHERE reason = 'Unplanned'
    AND start_date BETWEEN '2026-06-01' AND '2026-08-31';

  DELETE FROM leave_requests
  WHERE id IN (
    SELECT id FROM demo_cleanup_backup_leave_requests_20260914
  );

  SELECT COUNT(*) AS after_count FROM leave_requests
  WHERE reason = 'Unplanned'
    AND start_date BETWEEN '2026-06-01' AND '2026-08-31';
  -- Expected: 0.

COMMIT;


-- ── BLOCK 3: Delete seeded commissions ──────────────────────────────────────
BEGIN;

  SELECT COUNT(*) AS before_count FROM commissions
  WHERE period_year = 2026
    AND period_month IN (6, 7)
    AND base_amount IN (1000, 500, 10000, 12000);

  DELETE FROM commissions
  WHERE id IN (
    SELECT id FROM demo_cleanup_backup_commissions_20260914
  );

  SELECT COUNT(*) AS after_count FROM commissions
  WHERE period_year = 2026
    AND period_month IN (6, 7)
    AND base_amount IN (1000, 500, 10000, 12000);
  -- Expected: 0.

COMMIT;


-- ── BLOCK 4: Delete seeded attendance records ────────────────────────────────
BEGIN;

  SELECT COUNT(*) AS before_count FROM attendance
  WHERE date BETWEEN '2026-08-01' AND '2026-08-04';

  DELETE FROM attendance
  WHERE id IN (
    SELECT id FROM demo_cleanup_backup_attendance_20260914
  );

  SELECT COUNT(*) AS after_count FROM attendance
  WHERE date BETWEEN '2026-08-01' AND '2026-08-04';
  -- Expected: 0 (unless real attendance was recorded for those dates — check Section 0e output).

COMMIT;


-- ── BLOCK 5: Soft-delete the fake profile ───────────────────────────────────
-- We soft-delete first (is_active = false). Hard delete below if desired.
BEGIN;

  -- Confirm no remaining FK children before proceeding
  SELECT COUNT(*) AS remaining_children FROM performance_reviews WHERE employee_id = '00000000-0000-0000-0000-000000000000';
  SELECT COUNT(*) AS remaining_leaves FROM leave_requests WHERE employee_id = '00000000-0000-0000-0000-000000000000';
  SELECT COUNT(*) AS remaining_commissions FROM commissions WHERE agent_id = '00000000-0000-0000-0000-000000000000';
  SELECT COUNT(*) AS remaining_attendance FROM attendance WHERE employee_id = '00000000-0000-0000-0000-000000000000';
  -- All must be 0 before proceeding. If any > 0, ROLLBACK and delete children first.

  -- Soft-delete
  UPDATE profiles
  SET is_active = false,
      employment_status = 'terminated',
      updated_at = now()
  WHERE id = '00000000-0000-0000-0000-000000000000'
     OR email = 'top.performer@example.com';

  -- Verify
  SELECT id, email, is_active, employment_status FROM profiles
  WHERE id = '00000000-0000-0000-0000-000000000000'
     OR email = 'top.performer@example.com';
  -- Expected: is_active = false, employment_status = 'terminated'

COMMIT;


-- ── BLOCK 6 (Optional): Hard-delete the fake profile ─────────────────────────
-- Only run this AFTER Block 5 and AFTER confirming all children are gone.
-- Skip if you want to keep the soft-deleted row for audit purposes.
--
-- BEGIN;
--   DELETE FROM profiles
--   WHERE id = '00000000-0000-0000-0000-000000000000'
--      OR email = 'top.performer@example.com';
--   SELECT COUNT(*) FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';
--   -- Expected: 0
-- COMMIT;


-- ============================================================================
-- SECTION 3: FINAL VERIFICATION — RUN AFTER ALL BLOCKS
-- ============================================================================

-- 3a. Confirm fake profile is gone / soft-deleted
SELECT id, email, is_active, employment_status FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000000'
   OR email = 'top.performer@example.com';

-- 3b. Confirm seeded performance_reviews are gone
SELECT COUNT(*) AS remaining_seeded_reviews FROM performance_reviews
WHERE period_year = 2026
  AND period_month IN (5, 6, 7)
  AND review_type = 'monthly'
  AND kpi_score IN (85, 75, 60, 95, 96, 98)
  AND target_score = 90;
-- Expected: 0

-- 3c. Confirm seeded leave_requests are gone
SELECT COUNT(*) AS remaining_seeded_leaves FROM leave_requests
WHERE reason = 'Unplanned'
  AND start_date BETWEEN '2026-06-01' AND '2026-08-31';
-- Expected: 0

-- 3d. Confirm seeded commissions are gone
SELECT COUNT(*) AS remaining_seeded_commissions FROM commissions
WHERE period_year = 2026
  AND period_month IN (6, 7)
  AND base_amount IN (1000, 500, 10000, 12000);
-- Expected: 0

-- 3e. Confirm seeded attendance is gone
SELECT COUNT(*) AS remaining_seeded_attendance FROM attendance
WHERE date BETWEEN '2026-08-01' AND '2026-08-04';
-- Expected: 0

-- 3f. Confirm real profiles are intact
SELECT COUNT(*) AS real_active_profiles FROM profiles WHERE is_active = true;

-- 3g. Confirm backup tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'demo_cleanup_backup_%'
ORDER BY table_name;

-- 3h. Summary — what the dashboard will now show from real data
SELECT
  (SELECT COUNT(*) FROM bookings) AS total_bookings,
  (SELECT COUNT(*) FROM leads WHERE status = 'active') AS active_leads,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') AS paid_revenue,
  (SELECT COUNT(*) FROM profiles WHERE is_active = true) AS active_employees,
  (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending') AS pending_leaves;

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
