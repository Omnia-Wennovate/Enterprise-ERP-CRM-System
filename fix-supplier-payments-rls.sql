-- ============================================================================
-- FIX SUPPLIER PAYMENTS RLS POLICIES & MISSING COLUMNS
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wxtiyecrufkwtizsdnpx/sql/new
-- ============================================================================

-- 1. Ensure all optional columns exist so inserts and queries succeed
ALTER TABLE IF EXISTS public.supplier_payments
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS supplier_name text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ETB',
  ADD COLUMN IF NOT EXISTS notes text;

-- 2. Drop restrictive policies that block operations and demo-auth users
DROP POLICY IF EXISTS "admin_supplier_payments_full" ON public.supplier_payments;
DROP POLICY IF EXISTS "accountant_supplier_payments_full" ON public.supplier_payments;
DROP POLICY IF EXISTS "operations_supplier_payments_read" ON public.supplier_payments;
DROP POLICY IF EXISTS "Allow all" ON public.supplier_payments;
DROP POLICY IF EXISTS "Allow all access" ON public.supplier_payments;
DROP POLICY IF EXISTS "allow_all_supplier_payments" ON public.supplier_payments;

-- 3. Enable RLS (standard practice)
ALTER TABLE IF EXISTS public.supplier_payments ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policy (matching bookings, customers, suppliers in database-fix.sql)
CREATE POLICY "Allow all access" 
  ON public.supplier_payments 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 5. Verification query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'supplier_payments';
