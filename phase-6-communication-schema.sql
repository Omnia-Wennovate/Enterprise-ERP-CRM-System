-- ============================================================================
-- PHASE 6: ENTERPRISE COMMUNICATION CENTER
-- Complete Real-Time Internal Communication Platform
-- ============================================================================

-- ============================================================================
-- DROP EXISTING TABLES IF THEY EXIST (for clean migration)
-- ============================================================================

DROP TABLE IF EXISTS communication_audit_log CASCADE;
DROP TABLE IF EXISTS message_mentions CASCADE;
DROP TABLE IF EXISTS message_bookmarks CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
DROP TABLE IF EXISTS meeting_participants CASCADE;
DROP TABLE IF EXISTS meeting_rooms CASCADE;
DROP TABLE IF EXISTS poll_votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS tasks_from_messages CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS announcement_reads CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS channel_messages CASCADE;
DROP TABLE IF EXISTS department_channel_members CASCADE;
DROP TABLE IF EXISTS department_channels CASCADE;
DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS message_reads CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- ============================================================================
-- 1. CONVERSATIONS (DMs + Context-Linked Discussions)
-- ============================================================================

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'direct',
  title text,
  booking_id text,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id),
  is_archived boolean DEFAULT false,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_booking ON conversations(booking_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================================================
-- 2. CONVERSATION MEMBERS
-- ============================================================================

CREATE TABLE conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  is_muted boolean DEFAULT false,
  UNIQUE(conversation_id, profile_id)
);

CREATE INDEX idx_conversation_members_profile ON conversation_members(profile_id);

-- ============================================================================
-- 3. MESSAGES
-- ============================================================================

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  content text,
  type text NOT NULL DEFAULT 'text',
  parent_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  pinned_by uuid REFERENCES profiles(id),
  pinned_at timestamptz,
  forwarded_from uuid REFERENCES messages(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_parent ON messages(parent_id);

-- ============================================================================
-- 4. MESSAGE READS (Delivery/Read Status)
-- ============================================================================

CREATE TABLE message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, profile_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);

-- ============================================================================
-- 5. MESSAGE REACTIONS
-- ============================================================================

CREATE TABLE message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, profile_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);

-- ============================================================================
-- 6. MESSAGE ATTACHMENTS
-- ============================================================================

CREATE TABLE message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size_kb integer,
  duration_seconds integer,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);

-- ============================================================================
-- 7. DEPARTMENT CHANNELS
-- ============================================================================

CREATE TABLE department_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  is_private boolean DEFAULT false,
  is_readonly boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_department_channels_name ON department_channels(name);

-- ============================================================================
-- 8. DEPARTMENT CHANNEL MEMBERS
-- ============================================================================

CREATE TABLE department_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES department_channels(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE(channel_id, profile_id)
);

CREATE INDEX idx_department_channel_members_profile ON department_channel_members(profile_id);

-- ============================================================================
-- 9. CHANNEL MESSAGES
-- ============================================================================

CREATE TABLE channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES department_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  content text,
  type text NOT NULL DEFAULT 'text',
  parent_id uuid REFERENCES channel_messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  pinned_by uuid REFERENCES profiles(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_channel_messages_channel ON channel_messages(channel_id);
CREATE INDEX idx_channel_messages_sender ON channel_messages(sender_id);
CREATE INDEX idx_channel_messages_created ON channel_messages(created_at DESC);

-- ============================================================================
-- 10. ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  category text NOT NULL DEFAULT 'general',
  target_roles text[] DEFAULT '{}',
  published_by uuid REFERENCES profiles(id),
  published_at timestamptz,
  expires_at timestamptz,
  is_draft boolean DEFAULT true,
  requires_acknowledgement boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_announcements_published ON announcements(published_at DESC);
CREATE INDEX idx_announcements_expires ON announcements(expires_at);

-- ============================================================================
-- 11. ANNOUNCEMENT READS
-- ============================================================================

CREATE TABLE announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  acknowledged_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, profile_id)
);

CREATE INDEX idx_announcement_reads_profile ON announcement_reads(profile_id);

-- ============================================================================
-- 12. NOTIFICATION PREFERENCES
-- ============================================================================

CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  direct_messages boolean DEFAULT true,
  mentions boolean DEFAULT true,
  channel_messages boolean DEFAULT true,
  announcements boolean DEFAULT true,
  booking_discussions boolean DEFAULT true,
  task_assignments boolean DEFAULT true,
  meeting_invitations boolean DEFAULT true,
  poll_created boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 13. TASKS FROM MESSAGES
-- ============================================================================

CREATE TABLE tasks_from_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES profiles(id),
  assigned_by uuid REFERENCES profiles(id),
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  booking_id text,
  customer_id uuid REFERENCES customers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tasks_assigned_to ON tasks_from_messages(assigned_to);
CREATE INDEX idx_tasks_status ON tasks_from_messages(status);

-- ============================================================================
-- 14. POLLS
-- ============================================================================

CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES department_channels(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id),
  question text NOT NULL,
  is_anonymous boolean DEFAULT false,
  is_multiple_choice boolean DEFAULT false,
  closes_at timestamptz,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_polls_conversation ON polls(conversation_id);
CREATE INDEX idx_polls_channel ON polls(channel_id);

-- ============================================================================
-- 15. POLL OPTIONS
-- ============================================================================

CREATE TABLE poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  sort_order integer DEFAULT 0
);

CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);

-- ============================================================================
-- 16. POLL VOTES
-- ============================================================================

CREATE TABLE poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, option_id, profile_id)
);

CREATE INDEX idx_poll_votes_profile ON poll_votes(profile_id);

-- ============================================================================
-- 17. MEETING ROOMS
-- ============================================================================

CREATE TABLE meeting_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  agenda text,
  organizer_id uuid NOT NULL REFERENCES profiles(id),
  meeting_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  meeting_link text,
  location text,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  booking_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meeting_rooms_organizer ON meeting_rooms(organizer_id);
CREATE INDEX idx_meeting_rooms_date ON meeting_rooms(meeting_date);
CREATE INDEX idx_meeting_rooms_status ON meeting_rooms(status);

-- ============================================================================
-- 18. MEETING PARTICIPANTS
-- ============================================================================

CREATE TABLE meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited',
  responded_at timestamptz,
  UNIQUE(meeting_id, profile_id)
);

CREATE INDEX idx_meeting_participants_profile ON meeting_participants(profile_id);

-- ============================================================================
-- 19. USER PRESENCE
-- ============================================================================

CREATE TABLE user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'offline',
  last_seen_at timestamptz DEFAULT now(),
  custom_status text,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 20. MESSAGE BOOKMARKS
-- ============================================================================

CREATE TABLE message_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, message_id)
);

CREATE INDEX idx_message_bookmarks_profile ON message_bookmarks(profile_id);

-- ============================================================================
-- 21. MESSAGE MENTIONS
-- ============================================================================

CREATE TABLE message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_message_mentions_profile ON message_mentions(mentioned_profile_id);

-- ============================================================================
-- 22. COMMUNICATION AUDIT LOG
-- ============================================================================

CREATE TABLE communication_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  performed_by uuid REFERENCES profiles(id),
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_communication_audit_log_table ON communication_audit_log(table_name);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_from_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PERMISSIVE FOR DEVELOPMENT
-- ============================================================================

CREATE POLICY "conversations_all_access" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "conversation_members_all_access" ON conversation_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "messages_all_access" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "message_reads_all_access" ON message_reads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "message_reactions_all_access" ON message_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "message_attachments_all_access" ON message_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "department_channels_all_access" ON department_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "department_channel_members_all_access" ON department_channel_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "channel_messages_all_access" ON channel_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "announcements_all_access" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "announcement_reads_all_access" ON announcement_reads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notification_preferences_all_access" ON notification_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tasks_from_messages_all_access" ON tasks_from_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "polls_all_access" ON polls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "poll_options_all_access" ON poll_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "poll_votes_all_access" ON poll_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "meeting_rooms_all_access" ON meeting_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "meeting_participants_all_access" ON meeting_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_presence_all_access" ON user_presence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "message_bookmarks_all_access" ON message_bookmarks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "message_mentions_all_access" ON message_mentions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "communication_audit_log_all_access" ON communication_audit_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- INSERT DEFAULT DEPARTMENT CHANNELS
-- ============================================================================

INSERT INTO department_channels (name, description, icon, is_private, is_readonly, created_by)
VALUES 
  ('general', 'Company-wide announcements and discussions', 'Globe', false, false, NULL),
  ('sales', 'Sales team collaboration and updates', 'TrendingUp', false, false, NULL),
  ('operations', 'Operations and logistics discussions', 'Truck', false, false, NULL),
  ('finance', 'Finance and accounting discussions', 'DollarSign', false, false, NULL),
  ('hr', 'HR and employee-related discussions', 'Users', false, false, NULL),
  ('management', 'Management and executive discussions', 'Shield', true, false, NULL),
  ('announcements', 'Official company announcements (read-only)', 'Bell', false, true, NULL),
  ('support', 'Internal support and troubleshooting', 'HelpCircle', false, false, NULL)
ON CONFLICT (name) DO NOTHING;
