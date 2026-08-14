-- ============================================================================
-- PAYMENTS DASHBOARD ENTERPRISE UPGRADE — Schema Migration
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS guards)
-- ============================================================================

-- 1. Add status column to payments table (existing records become 'completed')
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';

-- 2. Create payment_allocations table for multi-invoice payments (Section 31)
--    Keeps existing payments.invoice_id for the common single-invoice case.
--    This table is ADDITIVE — only used when a payment spans multiple invoices.
CREATE TABLE IF NOT EXISTS payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Performance indexes for payment analytics
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_recorded_by ON payments(recorded_by);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice ON payment_allocations(invoice_id);

-- 4. Enable RLS on payment_allocations
ALTER TABLE IF EXISTS payment_allocations ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for payment_allocations (matching existing payment policies pattern)
DROP POLICY IF EXISTS "admin_payment_allocations_full" ON payment_allocations;
CREATE POLICY "admin_payment_allocations_full" ON payment_allocations
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

DROP POLICY IF EXISTS "accountant_payment_allocations_full" ON payment_allocations;
CREATE POLICY "accountant_payment_allocations_full" ON payment_allocations
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

DROP POLICY IF EXISTS "sales_agent_payment_allocations_read" ON payment_allocations;
CREATE POLICY "sales_agent_payment_allocations_read" ON payment_allocations
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'sales_agent'
  ));

-- Fallback permissive policy (matching existing pattern)
DROP POLICY IF EXISTS "Allow all access" ON payment_allocations;
CREATE POLICY "Allow all access" ON payment_allocations FOR ALL USING (true);
