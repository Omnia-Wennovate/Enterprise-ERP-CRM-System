-- ============================================================================
-- FIX CUSTOMERS TABLE SCHEMA & RLS
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Add missing columns to the customers table
ALTER TABLE IF EXISTS public.customers
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS customer_type text,
  ADD COLUMN IF NOT EXISTS mobile text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS annual_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_booking_date date;

-- 2. Ensure RLS is enabled
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all access" ON public.customers;
DROP POLICY IF EXISTS "Allow all customers" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;

-- 4. Create permissive RLS policies (matching your other tables)
CREATE POLICY "Allow all access" 
  ON public.customers 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
