-- ============================================================================
-- COMMUNICATION CENTER UPGRADE — ADDITIVE MIGRATION
-- Safe to run: no DROP, no ALTER on existing columns, no schema-breaking changes
-- ============================================================================

-- 1. Ensure department column on department_channels (for dept-scoped channel queries)
ALTER TABLE department_channels
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 2. Ensure archived_at on department_channels for archive/restore
ALTER TABLE department_channels
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 3. Ensure department column on tasks_from_messages for dept task visibility
ALTER TABLE tasks_from_messages
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 4. Ensure user_presence table exists (with all required columns)
CREATE TABLE IF NOT EXISTS user_presence (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'offline'
                CHECK (status IN ('online', 'busy', 'away', 'offline', 'in_meeting')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  custom_status TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- 5. Performance index: presence queries filter on last_seen_at
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen
  ON user_presence (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_presence_status
  ON user_presence (status);

-- 6. Performance index: channel messages by channel + created_at (realtime + unread count)
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_created
  ON channel_messages (channel_id, created_at DESC);

-- 7. Performance index: messages by conversation + created_at
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

-- 8. Performance index: tasks by assigned_to + status
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
  ON tasks_from_messages (assigned_to, status);

-- 9. Performance index: tasks by assigned_by
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by
  ON tasks_from_messages (assigned_by);

-- 10. Performance index: meetings by organizer + date
CREATE INDEX IF NOT EXISTS idx_meetings_organizer_date
  ON meeting_rooms (organizer_id, meeting_date);

-- 11. Performance index: meeting participants by profile
CREATE INDEX IF NOT EXISTS idx_meeting_participants_profile
  ON meeting_participants (profile_id);

-- 12. Ensure announcement_reads upsert-safe (unique constraint)
ALTER TABLE announcement_reads
  DROP CONSTRAINT IF EXISTS announcement_reads_announcement_profile_unique;

ALTER TABLE announcement_reads
  ADD CONSTRAINT announcement_reads_announcement_profile_unique
  UNIQUE (announcement_id, profile_id);

-- ============================================================================
-- PERMISSIVE RLS FOR PROTOTYPE (dev-only; replace with proper RBAC when
-- Supabase Auth sessions are enabled)
-- ============================================================================

-- Enable RLS on all communication tables if not already done
ALTER TABLE department_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_from_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies if they exist and re-apply (idempotent)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'department_channels', 'department_channel_members', 'channel_messages',
    'conversations', 'conversation_members', 'messages',
    'announcements', 'announcement_reads', 'tasks_from_messages',
    'meeting_rooms', 'meeting_participants', 'user_presence'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_for_prototype" ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY "allow_all_for_prototype" ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- Grant anon + authenticated access (required for Supabase anon key to work)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'department_channels', 'department_channel_members', 'channel_messages',
    'conversations', 'conversation_members', 'messages',
    'announcements', 'announcement_reads', 'tasks_from_messages',
    'meeting_rooms', 'meeting_participants', 'user_presence'
  ]) LOOP
    EXECUTE format('GRANT ALL ON %I TO anon, authenticated', tbl);
  END LOOP;
END $$;
