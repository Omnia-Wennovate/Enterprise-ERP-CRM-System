-- ============================================================================
-- ADVANCED HR ASSETS & EQUIPMENT MODULE UPGRADE
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. EXTEND ASSETS TABLE
-- ============================================================================
ALTER TABLE IF EXISTS public.assets
  ADD COLUMN IF NOT EXISTS asset_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS qr_code text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS purchase_price numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier text,
  ADD COLUMN IF NOT EXISTS warranty_expiry date,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS current_location text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS available_quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS assigned_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Default new status for existing assets if they are assigned
UPDATE public.assets SET status = 'assigned' WHERE is_assigned = true AND status = 'available';

-- ============================================================================
-- 2. EXTEND ASSET ASSIGNMENTS TABLE
-- ============================================================================
ALTER TABLE IF EXISTS public.asset_assignments
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS expected_return_date date,
  ADD COLUMN IF NOT EXISTS accessories_included text,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS digital_signature text,
  ADD COLUMN IF NOT EXISTS damage_notes text,
  ADD COLUMN IF NOT EXISTS missing_accessories text,
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS return_signature text;

-- ============================================================================
-- 3. CREATE ASSET MAINTENANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL, -- Preventive, Repair, Replacement, Cleaning, Inspection, Calibration
  maintenance_date date NOT NULL,
  vendor text,
  technician text,
  cost numeric(12,2) DEFAULT 0,
  invoice_url text,
  next_maintenance_date date,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  notes text,
  attachments text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset ON public.asset_maintenance(asset_id);
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.asset_maintenance FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. CREATE ASSET TRANSFERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  from_employee_id uuid REFERENCES public.profiles(id),
  to_employee_id uuid REFERENCES public.profiles(id),
  from_department text,
  to_department text,
  from_location text,
  to_location text,
  reason text,
  status text NOT NULL DEFAULT 'completed',
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset ON public.asset_transfers(asset_id);
ALTER TABLE public.asset_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.asset_transfers FOR ALL USING (true) WITH CHECK (true);
