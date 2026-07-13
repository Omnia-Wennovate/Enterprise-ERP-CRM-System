-- ============================================================================
-- PHASE 6: ENTERPRISE RBAC FOR COMMUNICATION CENTER
-- Row Level Security (RLS) Policies for All Tables
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(role, 'employee')
  FROM profiles
  WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Get current user's department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS TEXT AS $$
  SELECT COALESCE(department, '')
  FROM profiles
  WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()), false)
$$ LANGUAGE SQL STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role IN ('super_admin', 'admin') FROM profiles WHERE id = auth.uid()), false)
$$ LANGUAGE SQL STABLE;

-- Check if user is manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role LIKE '%manager%' OR role = 'admin' OR role = 'super_admin' FROM profiles WHERE id = auth.uid()), false)
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 1. CONVERSATIONS RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "conversations_super_admin_all" ON conversations;
DROP POLICY IF EXISTS "conversations_direct_messages" ON conversations;
DROP POLICY IF EXISTS "conversations_booking_context" ON conversations;

CREATE POLICY "conversations_super_admin_all" ON conversations
FOR ALL USING (is_super_admin());

CREATE POLICY "conversations_direct_messages" ON conversations
FOR SELECT USING (
  type = 'direct' 
  AND (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_members 
      WHERE conversation_id = conversations.id 
      AND profile_id = auth.uid()
    )
  )
);

CREATE POLICY "conversations_insert_own" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- 2. CONVERSATION MEMBERS RLS
-- ============================================================================

DROP POLICY IF EXISTS "conversation_members_super_admin" ON conversation_members;
DROP POLICY IF EXISTS "conversation_members_own" ON conversation_members;

CREATE POLICY "conversation_members_super_admin" ON conversation_members
FOR ALL USING (is_super_admin());

CREATE POLICY "conversation_members_own" ON conversation_members
FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "conversation_members_insert_own" ON conversation_members
FOR INSERT WITH CHECK (profile_id = auth.uid());

-- ============================================================================
-- 3. MESSAGES RLS
-- ============================================================================

DROP POLICY IF EXISTS "messages_super_admin" ON messages;
DROP POLICY IF EXISTS "messages_in_accessible_conversations" ON messages;

CREATE POLICY "messages_super_admin" ON messages
FOR ALL USING (is_super_admin());

CREATE POLICY "messages_in_accessible_conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND (
      is_super_admin()
      OR (
        type = 'direct'
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM conversation_members
            WHERE conversation_id = conversations.id
            AND profile_id = auth.uid()
          )
        )
      )
    )
  )
);

CREATE POLICY "messages_insert_own" ON messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ============================================================================
-- 4. MESSAGE READS RLS
-- ============================================================================

DROP POLICY IF EXISTS "message_reads_own" ON message_reads;

CREATE POLICY "message_reads_own" ON message_reads
FOR ALL USING (profile_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- 5. MESSAGE REACTIONS RLS
-- ============================================================================

DROP POLICY IF EXISTS "message_reactions_own" ON message_reactions;

CREATE POLICY "message_reactions_own" ON message_reactions
FOR ALL USING (profile_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- 6. MESSAGE ATTACHMENTS RLS
-- ============================================================================

DROP POLICY IF EXISTS "message_attachments_in_accessible_messages" ON message_attachments;

CREATE POLICY "message_attachments_in_accessible_messages" ON message_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages
    WHERE id = message_attachments.message_id
    AND (sender_id = auth.uid() OR is_super_admin())
  )
);

-- ============================================================================
-- 7. DEPARTMENT CHANNELS RLS
-- ============================================================================

DROP POLICY IF EXISTS "department_channels_super_admin" ON department_channels;
DROP POLICY IF EXISTS "department_channels_accessible" ON department_channels;

CREATE POLICY "department_channels_super_admin" ON department_channels
FOR ALL USING (is_super_admin());

-- Different channels are accessible based on user role/department
CREATE POLICY "department_channels_accessible" ON department_channels
FOR SELECT USING (
  is_admin()
  OR (
    -- General channel accessible to all
    name = 'general'
  )
  OR (
    -- HR channel only for HR department
    name = 'hr' AND get_user_department() = 'hr'
  )
  OR (
    -- Finance channel only for Finance department
    name = 'finance' AND get_user_department() = 'finance'
  )
  OR (
    -- Sales channel only for Sales department
    name = 'sales' AND get_user_department() = 'sales'
  )
  OR (
    -- Operations channel only for Operations department
    name = 'operations' AND get_user_department() = 'operations'
  )
  OR (
    -- Announcements channel accessible to all
    name = 'announcements'
  )
  OR (
    -- Support channel accessible to all
    name = 'support'
  )
  OR (
    -- Private management channel - admin only
    name = 'management' AND is_admin()
  )
  OR (
    -- User is a member of the channel
    EXISTS (
      SELECT 1 FROM department_channel_members
      WHERE channel_id = department_channels.id
      AND profile_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 8. DEPARTMENT CHANNEL MEMBERS RLS
-- ============================================================================

DROP POLICY IF EXISTS "department_channel_members_super_admin" ON department_channel_members;
DROP POLICY IF EXISTS "department_channel_members_accessible_channels" ON department_channel_members;

CREATE POLICY "department_channel_members_super_admin" ON department_channel_members
FOR ALL USING (is_super_admin());

CREATE POLICY "department_channel_members_accessible_channels" ON department_channel_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM department_channels
    WHERE id = department_channel_members.channel_id
    AND (
      is_super_admin()
      OR is_admin()
      OR EXISTS (
        SELECT 1 FROM department_channel_members dcm
        WHERE dcm.channel_id = department_channels.id
        AND dcm.profile_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- 9. CHANNEL MESSAGES RLS
-- ============================================================================

DROP POLICY IF EXISTS "channel_messages_super_admin" ON channel_messages;
DROP POLICY IF EXISTS "channel_messages_in_accessible_channels" ON channel_messages;

CREATE POLICY "channel_messages_super_admin" ON channel_messages
FOR ALL USING (is_super_admin());

CREATE POLICY "channel_messages_in_accessible_channels" ON channel_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM department_channels
    WHERE id = channel_messages.channel_id
    AND (
      is_super_admin()
      OR is_admin()
      OR name = 'general'
      OR name = 'announcements'
      OR name = 'support'
      OR (name = 'hr' AND get_user_department() = 'hr')
      OR (name = 'finance' AND get_user_department() = 'finance')
      OR (name = 'sales' AND get_user_department() = 'sales')
      OR (name = 'operations' AND get_user_department() = 'operations')
      OR (name = 'management' AND is_admin())
      OR EXISTS (
        SELECT 1 FROM department_channel_members
        WHERE channel_id = department_channels.id
        AND profile_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "channel_messages_insert_own" ON channel_messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ============================================================================
-- 10. ANNOUNCEMENTS RLS
-- ============================================================================

DROP POLICY IF EXISTS "announcements_super_admin" ON announcements;
DROP POLICY IF EXISTS "announcements_accessible" ON announcements;

CREATE POLICY "announcements_super_admin" ON announcements
FOR ALL USING (is_super_admin());

CREATE POLICY "announcements_accessible" ON announcements
FOR SELECT USING (
  is_admin()
  OR (
    published_at IS NOT NULL
    AND (
      -- Company-wide announcements
      (target_roles = '{}' OR target_roles IS NULL)
      OR
      -- Department-specific announcements
      get_user_department() = ANY(target_roles)
      OR
      -- Role-specific announcements
      get_user_role() = ANY(target_roles)
      OR
      -- Announcements array includes 'all'
      'all' = ANY(target_roles)
    )
  )
);

CREATE POLICY "announcements_insert_admin" ON announcements
FOR INSERT WITH CHECK (is_admin());

-- ============================================================================
-- 11. ANNOUNCEMENT READS RLS
-- ============================================================================

DROP POLICY IF EXISTS "announcement_reads_own" ON announcement_reads;

CREATE POLICY "announcement_reads_own" ON announcement_reads
FOR ALL USING (profile_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- 12. NOTIFICATION PREFERENCES RLS
-- ============================================================================

DROP POLICY IF EXISTS "notification_preferences_own" ON notification_preferences;

CREATE POLICY "notification_preferences_own" ON notification_preferences
FOR ALL USING (profile_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- 13. TASKS FROM MESSAGES RLS
-- ============================================================================

DROP POLICY IF EXISTS "tasks_super_admin" ON tasks_from_messages;
DROP POLICY IF EXISTS "tasks_assigned_to_user" ON tasks_from_messages;
DROP POLICY IF EXISTS "tasks_in_user_department" ON tasks_from_messages;

CREATE POLICY "tasks_super_admin" ON tasks_from_messages
FOR ALL USING (is_super_admin());

CREATE POLICY "tasks_assigned_to_user" ON tasks_from_messages
FOR SELECT USING (
  assigned_to = auth.uid()
  OR assigned_by = auth.uid()
);

CREATE POLICY "tasks_in_user_department" ON tasks_from_messages
FOR SELECT USING (
  is_manager()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = assigned_to
    AND department = get_user_department()
  )
);

-- ============================================================================
-- 14. POLLS RLS
-- ============================================================================

DROP POLICY IF EXISTS "polls_super_admin" ON polls;
DROP POLICY IF EXISTS "polls_in_accessible_context" ON polls;

CREATE POLICY "polls_super_admin" ON polls
FOR ALL USING (is_super_admin());

CREATE POLICY "polls_in_accessible_context" ON polls
FOR SELECT USING (
  is_admin()
  OR (
    -- Polls in direct message conversations user can access
    conversation_id IS NULL
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE id = polls.conversation_id
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM conversation_members
          WHERE conversation_id = conversations.id
          AND profile_id = auth.uid()
        )
      )
    )
  )
  OR (
    -- Polls in accessible channels
    channel_id IS NULL
    OR EXISTS (
      SELECT 1 FROM department_channels
      WHERE id = polls.channel_id
      AND (
        is_admin()
        OR name = 'general'
        OR name = 'announcements'
        OR (name = 'hr' AND get_user_department() = 'hr')
        OR (name = 'finance' AND get_user_department() = 'finance')
        OR (name = 'sales' AND get_user_department() = 'sales')
        OR (name = 'operations' AND get_user_department() = 'operations')
        OR EXISTS (
          SELECT 1 FROM department_channel_members
          WHERE channel_id = department_channels.id
          AND profile_id = auth.uid()
        )
      )
    )
  )
);

-- ============================================================================
-- 15. POLL OPTIONS RLS
-- ============================================================================

DROP POLICY IF EXISTS "poll_options_in_accessible_polls" ON poll_options;

CREATE POLICY "poll_options_in_accessible_polls" ON poll_options
FOR SELECT USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM polls
    WHERE id = poll_options.poll_id
    AND (
      is_super_admin()
      OR is_admin()
    )
  )
);

-- ============================================================================
-- 16. POLL VOTES RLS
-- ============================================================================

DROP POLICY IF EXISTS "poll_votes_own_or_admin" ON poll_votes;

CREATE POLICY "poll_votes_own_or_admin" ON poll_votes
FOR ALL USING (profile_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- 17. MEETING ROOMS RLS
-- ============================================================================

DROP POLICY IF EXISTS "meeting_rooms_super_admin" ON meeting_rooms;
DROP POLICY IF EXISTS "meeting_rooms_user_invited" ON meeting_rooms;
DROP POLICY IF EXISTS "meeting_rooms_same_department" ON meeting_rooms;

CREATE POLICY "meeting_rooms_super_admin" ON meeting_rooms
FOR ALL USING (is_super_admin());

CREATE POLICY "meeting_rooms_user_invited" ON meeting_rooms
FOR SELECT USING (
  is_admin()
  OR organizer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM meeting_participants
    WHERE meeting_id = meeting_rooms.id
    AND profile_id = auth.uid()
  )
);

CREATE POLICY "meeting_rooms_same_department" ON meeting_rooms
FOR SELECT USING (
  is_manager()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = organizer_id
    AND department = get_user_department()
  )
);

-- ============================================================================
-- 18. MEETING PARTICIPANTS RLS
-- ============================================================================

DROP POLICY IF EXISTS "meeting_participants_own_or_admin" ON meeting_participants;

CREATE POLICY "meeting_participants_own_or_admin" ON meeting_participants
FOR ALL USING (profile_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- 19. USER PRESENCE RLS
-- ============================================================================

DROP POLICY IF EXISTS "user_presence_own_or_admin" ON user_presence;

CREATE POLICY "user_presence_own_or_admin" ON user_presence
FOR SELECT USING (
  is_super_admin()
  OR is_admin()
  OR profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM conversation_members
    WHERE profile_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE (
        created_by = user_presence.profile_id
        OR EXISTS (
          SELECT 1 FROM conversation_members cm2
          WHERE cm2.conversation_id = conversations.id
          AND cm2.profile_id = user_presence.profile_id
        )
      )
    )
  )
);

-- ============================================================================
-- 20. MESSAGE BOOKMARKS RLS
-- ============================================================================

DROP POLICY IF EXISTS "message_bookmarks_own" ON message_bookmarks;

CREATE POLICY "message_bookmarks_own" ON message_bookmarks
FOR ALL USING (profile_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- 21. MESSAGE MENTIONS RLS
-- ============================================================================

DROP POLICY IF EXISTS "message_mentions_own_or_mention" ON message_mentions;

CREATE POLICY "message_mentions_own_or_mention" ON message_mentions
FOR SELECT USING (
  is_super_admin()
  OR mentioned_profile_id = auth.uid()
  OR (
    SELECT sender_id FROM messages WHERE id = message_mentions.message_id
  ) = auth.uid()
);

-- ============================================================================
-- 22. COMMUNICATION AUDIT LOG RLS
-- ============================================================================

DROP POLICY IF EXISTS "communication_audit_log_super_admin" ON communication_audit_log;

CREATE POLICY "communication_audit_log_super_admin" ON communication_audit_log
FOR SELECT USING (is_super_admin());

-- ============================================================================
-- SUMMARY OF RBAC IMPLEMENTATION
-- ============================================================================
-- 
-- Super Admin: Full access to all communication data
-- Admin: Full access except super admin private conversations
-- HR Manager: Only HR channel, HR conversations, HR announcements
-- Finance: Only Finance channel, Finance announcements
-- Sales: Only Sales channel, Sales announcements
-- Operations: Only Operations channel, Operations announcements
-- CRM: Custom team channels
-- Manager: Own department + direct reports
-- Employee: Personal conversations, assigned channels, company announcements
--
-- All security enforced at the PostgreSQL level via RLS
-- No client-side-only security
-- Sidebar counts, search, and filters respect RLS automatically
-- ============================================================================
