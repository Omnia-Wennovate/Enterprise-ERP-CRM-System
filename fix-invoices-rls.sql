-- ============================================================================
-- FIX INVOICES RLS POLICY (v3 - Ultimate Fix)
-- Run this once in the Supabase SQL Editor
-- ============================================================================

-- 1. Drop existing policies if they conflict
DROP POLICY IF EXISTS "sales_agent_invoices_insert" ON invoices;
DROP POLICY IF EXISTS "sales_agent_invoices_update" ON invoices;
DROP POLICY IF EXISTS "sales_agent_line_items_insert" ON invoice_line_items;

DROP POLICY IF EXISTS "allow_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "allow_update_invoices" ON invoices;
DROP POLICY IF EXISTS "allow_select_own_invoices" ON invoices;
DROP POLICY IF EXISTS "allow_insert_line_items" ON invoice_line_items;
DROP POLICY IF EXISTS "allow_update_line_items" ON invoice_line_items;
DROP POLICY IF EXISTS "allow_delete_line_items" ON invoice_line_items;

-- 2. Create highly permissive INSERT policy for invoices
CREATE POLICY "allow_insert_invoices" ON invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Create permissive UPDATE policy for invoices
CREATE POLICY "allow_update_invoices" ON invoices
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. CRITICAL FIX: Allow users to SELECT invoices they created 
-- (Prevents the "new row violates row-level security policy" error caused by PostgREST's .select() after insert)
CREATE POLICY "allow_select_own_invoices" ON invoices
  FOR SELECT USING (created_by = auth.uid());

-- 5. Create permissive INSERT policy for invoice line items
CREATE POLICY "allow_insert_line_items" ON invoice_line_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Ensure line items can be updated/deleted by authenticated users
CREATE POLICY "allow_update_line_items" ON invoice_line_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "allow_delete_line_items" ON invoice_line_items
  FOR DELETE USING (auth.role() = 'authenticated');
