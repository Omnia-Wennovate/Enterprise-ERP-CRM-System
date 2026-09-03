-- ============================================================================
-- OMNIA ERP — Social Media OAuth Migration
-- Run this in Supabase SQL Editor BEFORE connecting any real accounts.
-- Safe to run multiple times (all statements are idempotent).
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix legacy "manual" records that incorrectly show status = 'connected'
-- The existing TikTok row (and any similar manually-created rows) will be
-- marked properly so the UI stops showing a fake "Connected" badge.
-- Historical data (followers_count, profile_url, account_name) is preserved.
-- ============================================================================

UPDATE social_accounts
SET
  status = 'disconnected',          -- was 'connected' (fake legacy value)
  api_status = 'error',             -- was 'active'   (fake legacy value)
  connection_status = 'manual'      -- already correct, but enforce it
WHERE
  connection_status = 'manual'
  AND external_account_id IS NULL   -- never had a real OAuth connection
  AND access_token_encrypted IS NULL;

-- ============================================================================
-- STEP 2: Ensure social_account_metrics table has the right structure
-- (idempotent — adds columns only if missing)
-- ============================================================================

ALTER TABLE social_account_metrics
  ADD COLUMN IF NOT EXISTS likes_total bigint,          -- cumulative likes on profile (TikTok: total likes on all videos)
  ADD COLUMN IF NOT EXISTS saves integer,               -- Instagram saves (where available)
  ADD COLUMN IF NOT EXISTS link_clicks integer;         -- bio/link clicks (where available)

-- ============================================================================
-- STEP 3: Add missing index on social_posts for external sync deduplication
-- (idempotent — index already created by previous schema if it ran)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_external_dedup
  ON social_posts(account_id, external_post_id)
  WHERE external_post_id IS NOT NULL AND account_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Add a sync_triggered_by column to sync_job_log for observability
-- ============================================================================

ALTER TABLE sync_job_log
  ADD COLUMN IF NOT EXISTS triggered_by text DEFAULT 'manual'  -- 'manual' | 'scheduled' | 'oauth_callback'
    CHECK (triggered_by IN ('manual', 'scheduled', 'oauth_callback'));

-- ============================================================================
-- STEP 5: Verify the state after migration
-- Run this SELECT to confirm the TikTok row is now properly marked:
-- ============================================================================

-- SELECT id, platform, account_name, followers_count,
--        status, api_status, connection_status,
--        external_account_id, access_token_encrypted,
--        last_sync_status
-- FROM social_accounts
-- ORDER BY platform;

-- Expected output for the existing TikTok row:
--   status             = 'disconnected'
--   api_status         = 'error'
--   connection_status  = 'manual'
--   external_account_id = NULL
--   access_token_encrypted = NULL
--   last_sync_status   = NULL
-- After OAuth connection:
--   status             = 'connected'
--   api_status         = 'active'
--   connection_status  = 'oauth_connected'
--   external_account_id = '<real tiktok user id>'
--   access_token_encrypted = '<encrypted aes-256-gcm blob>'
--   last_sync_status   = 'success'
