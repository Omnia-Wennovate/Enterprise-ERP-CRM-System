import { createClient } from '@/lib/supabase/client'
import type {
  Conversation,
  Message,
  DepartmentChannel,
  ChannelMessage,
  Announcement,
  MeetingRoom,
  TaskFromMessage,
  Poll,
  UserPresence,
} from '@/types/communication'


// ============================================================================
// CONVERSATIONS & DIRECT MESSAGES
// ============================================================================

export async function createDirectConversation(
  participantIds: string[],
  createdBy: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: createdBy,
    })
    .select()
    .single()

  if (error) throw error

  // Add members
  const members = participantIds.map((profileId) => ({
    conversation_id: data.id,
    profile_id: profileId,
    role: 'member',
  }))

  await supabase.from('conversation_members').insert(members)

  return data as Conversation
}

export async function getConversations(profileId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      conversation_members!inner(profile_id),
      messages(created_at, sender_id, content) order by created_at desc limit 1
      `
    )
    .eq('conversation_members.profile_id', profileId)
    .order('last_message_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getConversationMessages(conversationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select(
      `
      *,
      message_reads(profile_id),
      message_reactions(*),
      message_attachments(*),
      message_mentions(mentioned_profile_id)
      `
    )
    .eq('conversation_id', conversationId)
    .eq('parent_id', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  type: 'text' | 'voice' | 'image' | 'file' = 'text'
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      type,
    })
    .select()
    .single()

  if (error) throw error

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return data as Message
}

// ============================================================================
// MESSAGE INTERACTIONS
// ============================================================================

export async function addMessageReaction(
  messageId: string,
  profileId: string,
  emoji: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('message_reactions')
    .upsert({
      message_id: messageId,
      profile_id: profileId,
      emoji,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markMessageAsRead(
  messageId: string,
  profileId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('message_reads')
    .upsert({
      message_id: messageId,
      profile_id: profileId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function pinMessage(
  messageId: string,
  pinnedBy: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .update({
      is_pinned: true,
      pinned_by: pinnedBy,
      pinned_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single()

  if (error) throw error
  return data as Message
}

// ============================================================================
// DEPARTMENT CHANNELS
// ============================================================================

export async function getChannels(profileId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('department_channels')
    .select(
      `
      *,
      department_channel_members(profile_id) where profile_id = '${profileId}'
      `
    )

  if (error) throw error
  return data as DepartmentChannel[]
}

export async function getChannelMessages(channelId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('channel_messages')
    .select('*')
    .eq('channel_id', channelId)
    .eq('parent_id', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function sendChannelMessage(
  channelId: string,
  senderId: string,
  content: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('channel_messages')
    .insert({
      channel_id: channelId,
      sender_id: senderId,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data as ChannelMessage
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

export async function publishAnnouncement(announcement: Partial<Announcement>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      ...announcement,
      is_draft: false,
      published_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as Announcement
}

export async function getAnnouncements(profileId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('announcements')
    .select('*')
    .eq('is_draft', false)
    .order('published_at', { ascending: false })

  if (profileId) {
    query = query.not('announcement_reads', 'is', null)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Announcement[]
}

export async function acknowledgeAnnouncement(
  announcementId: string,
  profileId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('announcement_reads')
    .upsert({
      announcement_id: announcementId,
      profile_id: profileId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// MEETINGS
// ============================================================================

export async function createMeeting(meeting: Partial<MeetingRoom>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('meeting_rooms')
    .insert(meeting)
    .select()
    .single()

  if (error) throw error
  return data as MeetingRoom
}

export async function getMeetings(organizerId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('meeting_rooms')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('meeting_date', { ascending: true })

  if (error) throw error
  return data as MeetingRoom[]
}

export async function respondToMeeting(
  meetingId: string,
  profileId: string,
  status: 'accepted' | 'declined' | 'tentative'
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('meeting_participants')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('meeting_id', meetingId)
    .eq('profile_id', profileId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// TASKS FROM MESSAGES
// ============================================================================

export async function createTaskFromMessage(task: Partial<TaskFromMessage>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks_from_messages')
    .insert(task)
    .select()
    .single()

  if (error) throw error
  return data as TaskFromMessage
}

export async function getTasksAssignedTo(profileId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks_from_messages')
    .select('*')
    .eq('assigned_to', profileId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data as TaskFromMessage[]
}

export async function updateTaskStatus(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks_from_messages')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data as TaskFromMessage
}

// ============================================================================
// USER PRESENCE
// ============================================================================

export async function updatePresence(
  profileId: string,
  status: 'online' | 'busy' | 'away' | 'offline' | 'in_meeting'
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_presence')
    .upsert({
      profile_id: profileId,
      status,
      last_seen_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as UserPresence
}

export async function getPresence(profileId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .eq('profile_id', profileId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as UserPresence | null
}

// ============================================================================
// MESSAGE BOOKMARKS
// ============================================================================

export async function bookmarkMessage(
  profileId: string,
  messageId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('message_bookmarks')
    .insert({
      profile_id: profileId,
      message_id: messageId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getBookmarkedMessages(profileId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('message_bookmarks')
    .select('*, messages(*)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// POLLS
// ============================================================================

export async function createPoll(poll: Partial<Poll>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('polls')
    .insert(poll)
    .select()
    .single()

  if (error) throw error
  return data as Poll
}

export async function votePoll(
  pollId: string,
  optionId: string,
  profileId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('poll_votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      profile_id: profileId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export async function getNotificationPreferences(profileId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  
  if (!data) {
    return await supabase
      .from('notification_preferences')
      .insert({ profile_id: profileId })
      .select()
      .single()
      .then(({ data }) => data)
  }

  return data
}

export async function updateNotificationPreferences(
  profileId: string,
  preferences: Partial<any>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      profile_id: profileId,
      ...preferences,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
