-- ============================================================================
-- Migration: track how much of a lead's budget the customer has paid
-- ============================================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2) NOT NULL DEFAULT 0;
