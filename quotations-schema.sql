-- ============================================================================
-- QUOTATIONS SCHEMA
-- Run this ONCE in Supabase SQL Editor
-- ============================================================================

-- Quotations master table
CREATE TABLE IF NOT EXISTS public.quotations (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number            text UNIQUE NOT NULL,
  quote_type              text NOT NULL DEFAULT 'manual',
  -- 'manual' | 'from_lead' | 'from_customer' | 'from_booking'
  lead_id                 uuid REFERENCES leads(id) ON DELETE SET NULL,
  customer_id             text,
  customer_name           text NOT NULL,
  company                 text,
  contact_person          text,
  email                   text,
  phone                   text,
  quote_title             text NOT NULL,
  destination             text NOT NULL,
  country                 text,
  city                    text,
  travel_type             text,
  departure_date          date NOT NULL,
  return_date             date NOT NULL,
  adults                  integer NOT NULL DEFAULT 1,
  children                integer NOT NULL DEFAULT 0,
  infants                 integer NOT NULL DEFAULT 0,
  currency                text NOT NULL DEFAULT 'USD',
  subtotal                numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount         numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount              numeric(14,2) NOT NULL DEFAULT 0,
  grand_total             numeric(14,2) NOT NULL DEFAULT 0,
  quotation_date          date NOT NULL DEFAULT CURRENT_DATE,
  valid_until             date NOT NULL,
  payment_terms           text,
  cancellation_policy     text,
  notes                   text,
  internal_notes          text,
  status                  text NOT NULL DEFAULT 'draft',
  -- draft | ready | sent | viewed | negotiation | accepted | rejected | expired | converted
  attachment_urls         text[] DEFAULT '{}',
  sent_at                 timestamptz,
  viewed_at               timestamptz,
  accepted_at             timestamptz,
  rejected_at             timestamptz,
  converted_to_booking_id text,
  created_by              uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- Quotation line items
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  service       text NOT NULL,
  description   text,
  quantity      integer NOT NULL DEFAULT 1,
  unit_price    numeric(14,2) NOT NULL DEFAULT 0,
  discount      numeric(5,2)  NOT NULL DEFAULT 0,
  tax_rate      numeric(5,2)  NOT NULL DEFAULT 0,
  total         numeric(14,2) NOT NULL DEFAULT 0,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_status      ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer    ON public.quotations(customer_name);
CREATE INDEX IF NOT EXISTS idx_quotations_created     ON public.quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_lead        ON public.quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quote  ON public.quotation_items(quotation_id);

-- Enable RLS
ALTER TABLE public.quotations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quotations' AND policyname = 'Allow all access'
  ) THEN
    -- Drop the old policy if it exists
    DROP POLICY IF EXISTS "Authenticated users full access quotations" ON public.quotations;
    
    CREATE POLICY "Allow all access"
      ON public.quotations FOR ALL
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quotation_items' AND policyname = 'Allow all access'
  ) THEN
    -- Drop the old policy if it exists
    DROP POLICY IF EXISTS "Authenticated users full access quotation_items" ON public.quotation_items;
    
    CREATE POLICY "Allow all access"
      ON public.quotation_items FOR ALL
      USING (true);
  END IF;
END $$;
