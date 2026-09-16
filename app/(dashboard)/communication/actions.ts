/**
 * Communication Center Server Actions
 *
 * All data fetching uses the Supabase browser client with the auth_user from
 * localStorage (matching the existing app-wide demo-auth pattern). Because
 * Supabase RLS depends on auth.uid(), and this app uses demo auth stored in
 * localStorage rather than Supabase Auth sessions, we pass the profile_id
 * explicitly to queries where needed, and rely on the existing permissive RLS
 * for the prototype stage. The RBAC upgrade SQL (phase-6-rbac-policies.sql)
 * can be applied when Supabase Auth sessions are enabled.
 *
 * NOTE: Functions marked "server action" are async functions that can be called
 * from both Server Components and Client Components as needed.
 *
 * FIX LOG (Communication Center Fix — 2026-09):
 * - getChannelsForUser: now filters by user dept + membership (was: all channels, no filter)
 * - publishAnnouncementAction: published_by is now validated as UUID; falls back to null
 *   rather than inserting a fake string that would cause an FK constraint violation.
 * - notifyAnnouncement: bulk-inserts into existing `notifications` table for all active profiles
 * - notifyTaskAssignment: inserts 1 notification for the assigned employee
 * - getNotificationsForUser / markNotificationRead: reuse existing notifications table
 */

'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunicationDashboardData {
  activeConversations: number
  onlineMembers: number
  unreadMessages: number
  pendingTasks: number
  upcomingMeetings: number
  unreadAnnouncements: number
  recentActivity: ActivityItem[]
  departmentSummary: DepartmentSummaryItem | null
}

export interface ActivityItem {
  id: string
  type: 'message' | 'task' | 'meeting' | 'announcement' | 'channel'
  title: string
  subtitle: string
  timestamp: string
  actorName: string
}

export interface DepartmentSummaryItem {
  department: string
  channels: number
  unreadMessages: number
  pendingTasks: number
  upcomingMeetings: number
  unreadAnnouncements: number
}

export interface ChannelWithMeta {
  id: string
  name: string
  description: string | null
  icon: string | null
  is_private: boolean
  is_readonly: boolean
  created_at: string
  memberCount: number
  unreadCount: number
  lastMessage: string | null
  lastMessageAt: string | null
  department: string
}

export interface ConversationWithMeta {
  id: string
  type: string
  title: string | null
  last_message_at: string
  created_at: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  otherParticipant: {
    id: string
    full_name: string
    department: string | null
    avatar_url: string | null
    presenceStatus: string
  } | null
}

export interface TaskWithMeta {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  due_date: string | null
  created_at: string
  updated_at: string
  booking_id: string | null
  customer_id: string | null
  assignedToName: string | null
  assignedByName: string | null
  isOverdue: boolean
  isDueToday: boolean
}

export interface MeetingWithMeta {
  id: string
  title: string
  description: string | null
  agenda: string | null
  meeting_date: string
  start_time: string
  end_time: string | null
  location: string | null
  meeting_link: string | null
  status: string
  booking_id: string | null
  created_at: string
  organizerName: string
  participantCount: number
  isOrganizer: boolean
}

export interface AnnouncementWithMeta {
  id: string
  title: string
  content: string
  priority: string
  category: string
  target_roles: string[]
  published_at: string | null
  expires_at: string | null
  publishedByName: string | null
  isRead: boolean
}

export interface SearchResult {
  id: string
  type: 'message' | 'channel_message' | 'announcement' | 'task' | 'meeting' | 'employee'
  title: string
  excerpt: string
  timestamp: string | null
  href: string
}

export interface EmployeeOption {
  id: string
  full_name: string
  department: string | null
  position: string | null
  avatar_url: string | null
}

// ─── Dashboard Data ────────────────────────────────────────────────────────────

export async function getCommunicationDashboardData(
  profileId: string,
  department: string | null
): Promise<CommunicationDashboardData> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Active conversations (user is a member of)
  const { count: activeConversations } = await supabase
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)

  // Online members (user_presence updated in last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count: onlineMembers } = await supabase
    .from('user_presence')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'online')
    .gte('last_seen_at', tenMinutesAgo)

  // Unread messages across all conversations
  const { data: convMemberships } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('profile_id', profileId)

  let unreadMessages = 0
  if (convMemberships && convMemberships.length > 0) {
    for (const membership of convMemberships) {
      const lastRead = membership.last_read_at || '1970-01-01T00:00:00Z'
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', membership.conversation_id)
        .gt('created_at', lastRead)
        .neq('sender_id', profileId)
      unreadMessages += count || 0
    }
  }

  // Pending tasks assigned to user
  const { count: pendingTasks } = await supabase
    .from('tasks_from_messages')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .in('status', ['pending', 'in_progress'])

  // Upcoming meetings this week
  const { count: upcomingMeetings } = await supabase
    .from('meeting_participants')
    .select('meeting_id, meeting_rooms!inner(meeting_date, status)', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .gte('meeting_rooms.meeting_date', today)
    .lte('meeting_rooms.meeting_date', weekFromNow.split('T')[0])
    .eq('meeting_rooms.status', 'scheduled')

  // Unread announcements
  const { data: publishedAnnouncements } = await supabase
    .from('announcements')
    .select('id')
    .eq('is_draft', false)
    .or(`target_roles.eq.{},target_roles.cs.{${department || 'general'}}`)
    .is('expires_at', null)

  let unreadAnnouncements = 0
  if (publishedAnnouncements && publishedAnnouncements.length > 0) {
    const announcementIds = publishedAnnouncements.map((a) => a.id)
    const { count: readCount } = await supabase
      .from('announcement_reads')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .in('announcement_id', announcementIds)
    unreadAnnouncements = announcementIds.length - (readCount || 0)
  }

  // Department summary
  let departmentSummary: DepartmentSummaryItem | null = null
  if (department) {
    // Channels for this department (by name matching)
    const { count: deptChannels } = await supabase
      .from('department_channels')
      .select('*', { count: 'exact', head: true })
      .ilike('name', `%${department}%`)

    departmentSummary = {
      department,
      channels: deptChannels || 0,
      unreadMessages,
      pendingTasks: pendingTasks || 0,
      upcomingMeetings: upcomingMeetings || 0,
      unreadAnnouncements,
    }
  }

  // Recent activity — last 10 channel messages the user can see
  const { data: recentChannelMessages } = await supabase
    .from('channel_messages')
    .select(`
      id, content, created_at, channel_id,
      profiles:sender_id(first_name, last_name),
      department_channels!inner(name)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentTasks } = await supabase
    .from('tasks_from_messages')
    .select('id, title, created_at, profiles:assigned_by(first_name, last_name)')
    .eq('assigned_to', profileId)
    .order('created_at', { ascending: false })
    .limit(3)

  const fullName = (p: any) => p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Team member' : 'Team member'

  const recentActivity: ActivityItem[] = [
    ...(recentChannelMessages || []).map((msg: any) => ({
      id: msg.id,
      type: 'message' as const,
      title: msg.content?.substring(0, 80) || 'New message',
      subtitle: `in #${msg.department_channels?.name || 'channel'}`,
      timestamp: msg.created_at,
      actorName: fullName(msg.profiles),
    })),
    ...(recentTasks || []).map((task: any) => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      subtitle: 'Task assigned to you',
      timestamp: task.created_at,
      actorName: fullName(task.profiles),
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  return {
    activeConversations: activeConversations || 0,
    onlineMembers: onlineMembers || 0,
    unreadMessages,
    pendingTasks: pendingTasks || 0,
    upcomingMeetings: upcomingMeetings || 0,
    unreadAnnouncements,
    recentActivity,
    departmentSummary,
  }
}

// ─── Channels ─────────────────────────────────────────────────────────────────

// Company-wide channels visible to all authenticated employees
const COMPANY_WIDE_CHANNELS = ['general', 'announcements', 'support']

/**
 * Returns channels visible to the given profile.
 *
 * Visibility rules (matching the channel access design in fix-communication-center.sql):
 *   1. Company-wide channels (general, announcements, support) → always included
 *   2. Channels where the user is an explicit member → always included
 *   3. Channels whose `department` matches the user's department → included
 *   4. Private channels not covered by 1-3 → excluded
 *
 * @param profileId  Real UUID from profiles table
 * @param department User's department from their profile (e.g. 'social_media', 'hr')
 */
export async function getChannelsForUser(
  profileId: string,
  department?: string | null
): Promise<ChannelWithMeta[]> {
  const supabase = await createClient()

  // Fetch the user's profile department if not passed (fallback)
  let userDept = department ?? null
  if (!userDept && profileId) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('department')
      .eq('id', profileId)
      .single()
    userDept = prof?.department ?? null
  }

  // Normalise department string — handles 'social_media', 'Social Media', etc.
  const deptNorm = userDept?.toLowerCase().replace(/[\s-]/g, '_') ?? null

  // Channels the user is explicitly a member of
  const { data: memberChannelIds } = await supabase
    .from('department_channel_members')
    .select('channel_id, last_read_at')
    .eq('profile_id', profileId)

  const memberMap = new Map<string, string | null>(
    (memberChannelIds || []).map((m: any) => [m.channel_id, m.last_read_at])
  )

  // Fetch all channels, then filter client-side (RLS is permissive; we apply
  // department logic here so the channel list matches design intent)
  const { data: channels, error } = await supabase
    .from('department_channels')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  if (!channels) return []

  const result: ChannelWithMeta[] = []

  for (const ch of channels) {
    const isCompanyWide = COMPANY_WIDE_CHANNELS.includes(ch.name.toLowerCase())
    const isMember = memberMap.has(ch.id)
    const chDept = (ch.department ?? ch.name).toLowerCase().replace(/[\s-]/g, '_')
    const isDeptMatch = deptNorm && (chDept === deptNorm ||
      // Marketing employees see both 'marketing' and 'social_media' channels
      (deptNorm === 'social_media' && chDept === 'marketing') ||
      (deptNorm === 'marketing' && chDept === 'social_media'))

    // Skip private channels the user isn't a member of (and not their dept)
    if (ch.is_private && !isMember && !isCompanyWide) continue
    // Skip channels that don't match any visibility rule
    if (!isCompanyWide && !isMember && !isDeptMatch) continue

    // Member count
    const { count: memberCount } = await supabase
      .from('department_channel_members')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', ch.id)

    // Last message
    const { data: lastMsgData } = await supabase
      .from('channel_messages')
      .select('content, created_at')
      .eq('channel_id', ch.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Unread count — use membership last_read_at if available
    const lastRead = memberMap.get(ch.id) ?? '1970-01-01T00:00:00Z'
    let unreadCount = 0
    if (isMember || isCompanyWide || isDeptMatch) {
      const { count } = await supabase
        .from('channel_messages')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', ch.id)
        .gt('created_at', lastRead)
        .neq('sender_id', profileId)
      unreadCount = count || 0
    }

    result.push({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      icon: ch.icon,
      is_private: ch.is_private,
      is_readonly: ch.is_readonly,
      created_at: ch.created_at,
      memberCount: memberCount || 0,
      unreadCount,
      lastMessage: lastMsgData?.content?.substring(0, 100) || null,
      lastMessageAt: lastMsgData?.created_at || null,
      department: ch.department ?? ch.name,
    })
  }

  return result
}

export async function getChannelDetail(channelId: string) {
  const supabase = await createClient()

  const { data: channel, error } = await supabase
    .from('department_channels')
    .select('*')
    .eq('id', channelId)
    .single()

  if (error) throw error

  const { data: members } = await supabase
    .from('department_channel_members')
    .select(`
      *,
      profiles:profile_id(id, first_name, last_name, department, avatar_url, position)
    `)
    .eq('channel_id', channelId)

  const { data: messages } = await supabase
    .from('channel_messages')
    .select(`
      *,
      profiles:sender_id(id, first_name, last_name, avatar_url, department)
    `)
    .eq('channel_id', channelId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(100)

  const normName = (p: any) => p ? ({ ...p, full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown' }) : null

  const normalizedMembers = (members || []).map((m: any) => ({
    ...m,
    profiles: normName(m.profiles),
  }))

  const normalizedMessages = (messages || []).map((m: any) => ({
    ...m,
    profiles: normName(m.profiles),
  }))

  return { channel, members: normalizedMembers, messages: normalizedMessages }
}

export async function sendChannelMessageAction(
  channelId: string,
  senderId: string,
  content: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('channel_messages')
    .insert({ channel_id: channelId, sender_id: senderId, content })
    .select(`*, profiles:sender_id(id, first_name, last_name, avatar_url), department_channels:channel_id(name)`)
    .single()
  if (error) throw error

  // Notify channel members
  const senderName = data.profiles ? `${data.profiles.first_name || ''} ${data.profiles.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
  const channelName = data.department_channels ? (data.department_channels as any).name : 'Channel'
  notifyChannelMessage(channelId, data.id, channelName, content, senderId, senderName).catch(e => console.error(e))

  return data
}

export async function markChannelRead(channelId: string, profileId: string) {
  const supabase = await createClient()
  await supabase
    .from('department_channel_members')
    .upsert({ channel_id: channelId, profile_id: profileId, last_read_at: new Date().toISOString() })
}

export async function createChannelAction(data: {
  name: string
  description: string
  is_private: boolean
  createdBy: string
}) {
  const supabase = await createClient()
  const { data: channel, error } = await supabase
    .from('department_channels')
    .insert({
      name: data.name.toLowerCase().replace(/\s+/g, '-'),
      description: data.description,
      is_private: data.is_private,
      created_by: data.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  // Auto-add creator as admin member
  await supabase.from('department_channel_members').insert({
    channel_id: channel.id,
    profile_id: data.createdBy,
    role: 'moderator',
  })
  return channel
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

export async function getConversationsForUser(profileId: string): Promise<ConversationWithMeta[]> {
  const supabase = await createClient()

  const { data: memberships, error } = await supabase
    .from('conversation_members')
    .select(`
      conversation_id, last_read_at,
      conversations!inner(id, type, title, last_message_at, created_at)
    `)
    .eq('profile_id', profileId)
    .order('conversations(last_message_at)', { ascending: false })

  if (error) throw error
  if (!memberships) return []

  const result: ConversationWithMeta[] = []

  for (const m of memberships) {
    const conv = (m as any).conversations
    if (!conv) continue

    // Get other participant
    const { data: otherMembers } = await supabase
      .from('conversation_members')
      .select(`profiles:profile_id(id, first_name, last_name, email, department, avatar_url)`)
      .eq('conversation_id', conv.id)
      .neq('profile_id', profileId)
      .limit(1)

    const otherProfile = (otherMembers?.[0] as any)?.profiles || null

    // Get presence for other participant
    let presenceStatus = 'offline'
    if (otherProfile?.id) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const { data: presence } = await supabase
        .from('user_presence')
        .select('status, last_seen_at')
        .eq('profile_id', otherProfile.id)
        .single()
      if (presence) {
        presenceStatus =
          presence.last_seen_at > tenMinutesAgo ? presence.status : 'offline'
      }
    }

    // Last message
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', conv.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Unread count
    const lastRead = m.last_read_at || '1970-01-01T00:00:00Z'
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .gt('created_at', lastRead)
      .neq('sender_id', profileId)

    result.push({
      id: conv.id,
      type: conv.type,
      title: conv.title,
      last_message_at: conv.last_message_at,
      created_at: conv.created_at,
      lastMessage: lastMsg?.content?.substring(0, 100) || null,
      lastMessageAt: lastMsg?.created_at || null,
      unreadCount: unreadCount || 0,
      otherParticipant: otherProfile
        ? {
            id: otherProfile.id,
            full_name: resolveEmployeeName(otherProfile).full_name,
            department: otherProfile.department,
            avatar_url: otherProfile.avatar_url,
            presenceStatus,
          }
        : null,
    })
  }

  return result
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id(id, first_name, last_name, email, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw error
  // normalize full_name using email-based fallback (handles 'User' placeholder)
  return (data || []).map((m: any) => ({
    ...m,
    profiles: m.profiles ? {
      ...m.profiles,
      full_name: resolveEmployeeName(m.profiles).full_name,
    } : null,
  }))
}

export async function sendDMAction(
  conversationId: string,
  senderId: string,
  content: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select(`*, profiles:sender_id(id, first_name, last_name, avatar_url)`)
    .single()
  if (error) throw error
  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
    
  // Notify other participant
  const senderName = data.profiles ? `${data.profiles.first_name || ''} ${data.profiles.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
  notifyDM(conversationId, data.id, content, senderId, senderName).catch(e => console.error(e))

  return data
}

export async function markConversationRead(conversationId: string, profileId: string) {
  const supabase = await createClient()
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId)
}

export async function createDirectConversationAction(
  profileId: string,
  targetProfileId: string
): Promise<string> {
  const supabase = await createClient()

  // Check if DM already exists between these two users
  const { data: existing } = await supabase
    .from('conversation_members')
    .select('conversation_id, conversations!inner(type)')
    .eq('profile_id', profileId)

  if (existing) {
    for (const m of existing) {
      const conv = (m as any).conversations
      if (conv?.type !== 'direct') continue
      const { data: otherMember } = await supabase
        .from('conversation_members')
        .select('profile_id')
        .eq('conversation_id', m.conversation_id)
        .eq('profile_id', targetProfileId)
        .single()
      if (otherMember) return m.conversation_id
    }
  }

  // Create new conversation
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ type: 'direct', created_by: profileId })
    .select()
    .single()
  if (error) throw error

  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, profile_id: profileId, role: 'member' },
    { conversation_id: conv.id, profile_id: targetProfileId, role: 'member' },
  ])

  return conv.id
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasksForUser(
  profileId: string,
  department: string | null,
  role: string
): Promise<TaskWithMeta[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Resolve name from profile row (handles the 'User' placeholder problem)
  const pName = (p: any): string | null => {
    if (!p) return null
    const email = (p.email || '').toLowerCase().trim()
    const isGeneric = !p.first_name || p.first_name.trim().toLowerCase() === 'user'
    if (!isGeneric) {
      return `${p.first_name || ''} ${p.last_name || ''}`.trim() || null
    }
    const known = KNOWN_EMPLOYEE_NAMES[email]
    if (known) return known.full
    // Derive from email
    const local = email.split('@')[0] || ''
    const derived = local.replace(/\d+/g, '').replace(/[._\-+]/g, ' ').trim()
    const words = derived.split(/\s+/).filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    return words.join(' ') || email || null
  }

  // My tasks (assigned to me)
  const { data: myTasks, error } = await supabase
    .from('tasks_from_messages')
    .select(`
      *,
      assignedTo:profiles!tasks_from_messages_assigned_to_fkey(first_name, last_name, email),
      assignedBy:profiles!tasks_from_messages_assigned_by_fkey(first_name, last_name, email)
    `)
    .eq('assigned_to', profileId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) throw error

  const mapTask = (task: any): TaskWithMeta => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_date: task.due_date,
    created_at: task.created_at,
    updated_at: task.updated_at,
    booking_id: task.booking_id,
    customer_id: task.customer_id,
    assignedToName: pName(task.assignedTo),
    assignedByName: pName(task.assignedBy),
    isOverdue: task.due_date ? task.due_date < today && task.status !== 'completed' : false,
    isDueToday: task.due_date === today,
  })

  let tasks = (myTasks || []).map(mapTask)

  // Tasks created by me (for others) — all roles can see tasks they assigned
  const { data: createdByMe } = await supabase
    .from('tasks_from_messages')
    .select(`
      *,
      assignedTo:profiles!tasks_from_messages_assigned_to_fkey(first_name, last_name, email),
      assignedBy:profiles!tasks_from_messages_assigned_by_fkey(first_name, last_name, email)
    `)
    .eq('assigned_by', profileId)
    .neq('assigned_to', profileId)
    .order('created_at', { ascending: false })

  if (createdByMe) {
    const existingIds = new Set(tasks.map((t) => t.id))
    tasks = [...tasks, ...createdByMe.map(mapTask).filter((t) => !existingIds.has(t.id))]
  }

  return tasks
}

export async function createTaskAction(data: {
  title: string
  description?: string
  assignedTo?: string
  assignedBy: string
  assignedByName?: string
  priority: string
  dueDate?: string
  bookingId?: string
  customerId?: string
}): Promise<string> {
  const supabase = await createClient()
  const { data: task, error } = await supabase
    .from('tasks_from_messages')
    .insert({
      title: data.title,
      description: data.description || null,
      assigned_to: data.assignedTo || null,
      assigned_by: data.assignedBy,
      priority: data.priority,
      due_date: data.dueDate || null,
      status: 'pending',
      booking_id: data.bookingId || null,
      customer_id: data.customerId || null,
    })
    .select('id')
    .single()
  if (error) throw error

  // Notify the assigned employee (non-blocking — fire and forget)
  if (data.assignedTo && data.assignedTo !== data.assignedBy) {
    notifyTaskAssignment(
      task.id,
      data.title,
      data.assignedTo,
      data.assignedByName || ''
    ).catch((e) => console.error('[notifyTaskAssignment] error:', e))
  }

  return task.id
}

export async function updateTaskStatusAction(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks_from_messages')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)
  if (error) throw error
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export async function getMeetingsForUser(profileId: string): Promise<MeetingWithMeta[]> {
  const supabase = await createClient()

  const { data: organized, error: e1 } = await supabase
    .from('meeting_rooms')
    .select(`
      *,
      organizer:profiles!meeting_rooms_organizer_id_fkey(first_name, last_name),
      meeting_participants(profile_id)
    `)
    .eq('organizer_id', profileId)
    .order('meeting_date', { ascending: true })

  const { data: participating, error: e2 } = await supabase
    .from('meeting_participants')
    .select(`
      meeting_rooms!inner(
        *,
        organizer:profiles!meeting_rooms_organizer_id_fkey(first_name, last_name),
        meeting_participants(profile_id)
      )
    `)
    .eq('profile_id', profileId)

  if (e1) throw e1

  const mapMeeting = (m: any, isOrg: boolean): MeetingWithMeta => ({
    id: m.id,
    title: m.title,
    description: m.description,
    agenda: m.agenda,
    meeting_date: m.meeting_date,
    start_time: m.start_time,
    end_time: m.end_time,
    location: m.location,
    meeting_link: m.meeting_link,
    status: m.status,
    booking_id: m.booking_id,
    created_at: m.created_at,
    organizerName: m.organizer ? `${m.organizer.first_name || ''} ${m.organizer.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
    participantCount: m.meeting_participants?.length || 0,
    isOrganizer: isOrg,
  })

  const allMeetings = new Map<string, MeetingWithMeta>()
  for (const m of organized || []) {
    allMeetings.set(m.id, mapMeeting(m, true))
  }
  for (const p of participating || []) {
    const m = (p as any).meeting_rooms
    if (m && !allMeetings.has(m.id)) {
      allMeetings.set(m.id, mapMeeting(m, false))
    }
  }

  return Array.from(allMeetings.values()).sort(
    (a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
  )
}

export async function createMeetingAction(data: {
  title: string
  description?: string
  agenda?: string
  meetingDate: string
  startTime: string
  endTime?: string
  location?: string
  meetingLink?: string
  organizerId: string
  participantIds: string[]
}): Promise<string> {
  const supabase = await createClient()
  const { data: meeting, error } = await supabase
    .from('meeting_rooms')
    .insert({
      title: data.title,
      description: data.description || null,
      agenda: data.agenda || null,
      meeting_date: data.meetingDate,
      start_time: data.startTime,
      end_time: data.endTime || null,
      location: data.location || null,
      meeting_link: data.meetingLink || null,
      organizer_id: data.organizerId,
      status: 'scheduled',
    })
    .select('id')
    .single()
  if (error) throw error

  if (data.participantIds.length > 0) {
    await supabase.from('meeting_participants').insert(
      data.participantIds.map((pid) => ({
        meeting_id: meeting.id,
        profile_id: pid,
        status: 'invited',
      }))
    )
    
    // Fetch organizer name and notify
    try {
      const { data: orgData } = await supabase.from('profiles').select('first_name, last_name').eq('id', data.organizerId).single()
      const organizerName = orgData ? `${orgData.first_name || ''} ${orgData.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
      await notifyMeeting(meeting.id, data.title, data.organizerId, organizerName, data.participantIds)
    } catch (e) {
      console.error('[notifyMeeting] error:', e)
    }
  }
  return meeting.id
}

export async function updateMeetingStatusAction(meetingId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('meeting_rooms')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', meetingId)
  if (error) throw error
}

// ─── Notifications (reuses existing `notifications` table) ──────────────────────

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  recipient_id: string | null
  related_to_id: string | null
  related_to_type: string | null
  is_read: boolean
  created_at: string
}

/**
 * Fetch notifications for a given profile, newest first.
 * Reuses the existing `notifications` table (phase-x-leads-schema.sql).
 */
export async function getNotificationsForUser(profileId: string): Promise<NotificationItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data || []) as NotificationItem[]
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
}

export async function markAllNotificationsRead(profileId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', profileId)
    .eq('is_read', false)
}

/**
 * Dispatch announcement notifications to all eligible employees.
 * Uses ON CONFLICT DO NOTHING (backed by the unique constraint
 * `notifications_recipient_type_source_unique`) to prevent duplicates
 * on double-submit or retry.
 *
 * @param announcementId  The newly created announcement UUID
 * @param title           Announcement title
 * @param targetRoles     [] = company-wide; otherwise dept/role list
 * @param publishedByName Display name of the author
 */
async function notifyAnnouncement(
  announcementId: string,
  title: string,
  targetRoles: string[],
  publishedByName: string
): Promise<void> {
  const supabase = await createClient()

  // Fetch eligible recipient profiles
  let query = supabase
    .from('profiles')
    .select('id, department, role')
    .eq('is_active', true)

  // If targeted, filter by department or role
  if (targetRoles.length > 0 && !targetRoles.includes('all')) {
    // Supabase doesn't support OR across different columns in a single call,
    // so we fetch all and filter client-side (dataset is small — typically < 200)
    const { data: allProfiles } = await query
    const eligible = (allProfiles || []).filter((p: any) =>
      targetRoles.includes(p.department) || targetRoles.includes(p.role)
    )
    if (eligible.length === 0) return

    const rows = eligible.map((p: any) => ({
      title: 'New Announcement',
      message: `${publishedByName ? publishedByName + ': ' : ''}${title}`,
      type: 'announcement',
      recipient_id: p.id,
      related_to_id: announcementId,
      related_to_type: 'announcement',
      is_read: false,
    }))
    // ON CONFLICT DO NOTHING prevents duplicates (unique constraint on recipient+type+source)
    await supabase.from('notifications').upsert(rows, {
      onConflict: 'recipient_id,type,related_to_id',
      ignoreDuplicates: true,
    })
    return
  }

  // Company-wide: notify all active profiles
  const { data: allProfiles } = await query
  if (!allProfiles || allProfiles.length === 0) return

  const rows = allProfiles.map((p: any) => ({
    title: 'New Announcement',
    message: `${publishedByName ? publishedByName + ': ' : ''}${title}`,
    type: 'announcement',
    recipient_id: p.id,
    related_to_id: announcementId,
    related_to_type: 'announcement',
    is_read: false,
  }))

  await supabase.from('notifications').upsert(rows, {
    onConflict: 'recipient_id,type,related_to_id',
    ignoreDuplicates: true,
  })
}

/**
 * Dispatch a task-assignment notification to the assigned employee.
 * Safe to call multiple times — the unique constraint prevents duplicates.
 */
async function notifyTaskAssignment(
  taskId: string,
  taskTitle: string,
  assignedToId: string,
  assignedByName: string
): Promise<void> {
  if (!assignedToId) return
  const supabase = await createClient()
  await supabase.from('notifications').upsert(
    {
      title: 'Task Assigned to You',
      message: `${assignedByName ? assignedByName + ' assigned you: ' : ''}${taskTitle}`,
      type: 'task_assignment',
      recipient_id: assignedToId,
      related_to_id: taskId,
      related_to_type: 'task',
      is_read: false,
    },
    { onConflict: 'recipient_id,type,related_to_id', ignoreDuplicates: true }
  )
}

/**
 * Dispatch channel message notifications to all members except the sender.
 */
async function notifyChannelMessage(
  channelId: string,
  messageId: string,
  channelName: string,
  content: string,
  senderId: string,
  senderName: string
): Promise<void> {
  const supabase = await createClient()
  // Fetch channel members
  const { data: members } = await supabase
    .from('department_channel_members')
    .select('profile_id')
    .eq('channel_id', channelId)
    .neq('profile_id', senderId)
    
  if (!members || members.length === 0) return

  const snippet = content.length > 50 ? content.substring(0, 50) + '...' : content
  const rows = members.map((m: any) => ({
    title: `New message in #${channelName}`,
    message: `${senderName}: ${snippet}`,
    type: 'channel_message',
    recipient_id: m.profile_id,
    related_to_id: messageId,
    related_to_type: 'channel_message',
    is_read: false,
  }))

  await supabase.from('notifications').upsert(rows, {
    onConflict: 'recipient_id,type,related_to_id',
    ignoreDuplicates: true,
  })
}

/**
 * Dispatch direct message notification to the other participant.
 */
async function notifyDM(
  conversationId: string,
  messageId: string,
  content: string,
  senderId: string,
  senderName: string
): Promise<void> {
  const supabase = await createClient()
  // Fetch conversation members except sender
  const { data: members } = await supabase
    .from('conversation_members')
    .select('profile_id')
    .eq('conversation_id', conversationId)
    .neq('profile_id', senderId)
    
  if (!members || members.length === 0) return

  const snippet = content.length > 50 ? content.substring(0, 50) + '...' : content
  const rows = members.map((m: any) => ({
    title: `New DM from ${senderName}`,
    message: snippet,
    type: 'direct_message',
    recipient_id: m.profile_id,
    related_to_id: messageId,
    related_to_type: 'direct_message',
    is_read: false,
  }))

  await supabase.from('notifications').upsert(rows, {
    onConflict: 'recipient_id,type,related_to_id',
    ignoreDuplicates: true,
  })
}

/**
 * Dispatch meeting notifications to all invited participants.
 */
async function notifyMeeting(
  meetingId: string,
  title: string,
  organizerId: string,
  organizerName: string,
  participantIds: string[]
): Promise<void> {
  if (participantIds.length === 0) return
  const supabase = await createClient()
  
  const rows = participantIds.map((pid) => ({
    title: 'New Meeting Invitation',
    message: `${organizerName} invited you to: ${title}`,
    type: 'meeting_invitation',
    recipient_id: pid,
    related_to_id: meetingId,
    related_to_type: 'meeting',
    is_read: false,
  }))

  await supabase.from('notifications').upsert(rows, {
    onConflict: 'recipient_id,type,related_to_id',
    ignoreDuplicates: true,
  })
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function getAnnouncementsForUser(
  profileId: string,
  department: string | null,
  role: string
): Promise<AnnouncementWithMeta[]> {
  const supabase = await createClient()

  const { data: announcements, error } = await supabase
    .from('announcements')
    .select(`
      *,
      publisher:profiles!announcements_published_by_fkey(first_name, last_name),
      announcement_reads!left(profile_id, acknowledged_at)
    `)
    .eq('is_draft', false)
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return (announcements || []).map((a: any) => {
    const targetRoles: string[] = a.target_roles || []
    // Check if announcement is visible to this user
    const isCompanyWide = targetRoles.length === 0 || targetRoles.includes('all')
    const isDeptMatch = department && targetRoles.includes(department)
    const isRoleMatch = targetRoles.includes(role)

    if (!isCompanyWide && !isDeptMatch && !isRoleMatch && role !== 'super_admin' && role !== 'admin') {
      return null
    }

    const reads: any[] = a.announcement_reads || []
    const isRead = reads.some((r: any) => r.profile_id === profileId)

    return {
      id: a.id,
      title: a.title,
      content: a.content,
      priority: a.priority,
      category: a.category,
      target_roles: targetRoles,
      published_at: a.published_at,
      expires_at: a.expires_at,
      publishedByName: a.publisher ? `${a.publisher.first_name || ''} ${a.publisher.last_name || ''}`.trim() || null : null,
      isRead,
    } as AnnouncementWithMeta
  }).filter(Boolean) as AnnouncementWithMeta[]
}

export async function markAnnouncementRead(announcementId: string, profileId: string) {
  const supabase = await createClient()
  await supabase
    .from('announcement_reads')
    .upsert({ announcement_id: announcementId, profile_id: profileId })
}

/** Simple UUID v4 format check */
function isValidUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export async function publishAnnouncementAction(data: {
  title: string
  content: string
  priority: string
  category: string
  targetRoles: string[]
  publishedBy: string
  expiresAt?: string
  publishedByName?: string
}): Promise<string> {
  const supabase = await createClient()

  // Validate published_by — must be a real UUID referencing profiles(id).
  // If it's a fake/derived string (e.g. 'user_admin'), the DB would throw an FK
  // violation. We fall back to null (the column allows null) so the insert succeeds.
  let publishedBy: string | null = null
  if (data.publishedBy && isValidUUID(data.publishedBy)) {
    // Verify the UUID actually exists in profiles
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('id', data.publishedBy)
    publishedBy = (count && count > 0) ? data.publishedBy : null
  }

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title: data.title,
      content: data.content,
      priority: data.priority,
      category: data.category,
      target_roles: data.targetRoles,
      published_by: publishedBy,
      published_at: new Date().toISOString(),
      is_draft: false,
      expires_at: data.expiresAt || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to publish announcement: ${error.message}`)

  // Dispatch notifications to all eligible employees (non-blocking — fire and forget)
  notifyAnnouncement(
    announcement.id,
    data.title,
    data.targetRoles,
    data.publishedByName || ''
  ).catch((e) => console.error('[notifyAnnouncement] error:', e))

  return announcement.id
}

// Known real employee names keyed by email (used as fallback when DB first_name = 'User')
const KNOWN_EMPLOYEE_NAMES: Record<string, { full: string; position?: string }> = {
  'bekan.bekele74@gmail.com': { full: 'Bekan Bekele', position: 'Operations Officer' },
  'kalkidantesfaye21971@gmail.com': { full: 'Kalkidan Tesfaye', position: 'Sales Agent' },
  'nurfaris08@gmail.com': { full: 'Nur Faris', position: 'Operations Officer' },
  'alaminfsiraj@gmail.com': { full: 'Alamin Siraj', position: 'HR Manager' },
  'davidbezuneh@gmail.com': { full: 'David Bezuneh', position: 'Social Media Manager' },
  'melika.wennovate@gmail.com': { full: 'Melika Wennovate', position: 'Accountant' },
  'belenwolde2@gmail.com': { full: 'Belen Wolde', position: 'Social Media Officer' },
  'zuludalo98@gmail.com': { full: 'Zulu Dalo', position: 'Sales Agent' },
  'admin@omniatravel.com': { full: 'Omnia Admin', position: 'System Administrator' },
  'manager@omniatravel.com': { full: 'Operations Manager', position: 'Operations Manager' },
  'hr@omniatravel.com': { full: 'HR Team', position: 'HR Officer' },
  'marketing@omniatravel.com': { full: 'Marketing Team', position: 'Marketing Officer' },
  'sales@omniatravel.com': { full: 'Sales Team', position: 'Sales Agent' },
  'ops@omniatravel.com': { full: 'Ops Team', position: 'Operations Officer' },
}

/** Resolve a display name from profile data, using email-based fallback for generic 'User' values. */
function resolveEmployeeName(p: { first_name?: string | null; last_name?: string | null; email?: string | null; position?: string | null }): { full_name: string; position: string | null } {
  const email = (p.email || '').toLowerCase().trim()
  const known = KNOWN_EMPLOYEE_NAMES[email]

  // If DB has a real first_name (not the generic 'User' placeholder), use it
  const isGenericFirstName = !p.first_name || p.first_name.trim().toLowerCase() === 'user'
  if (!isGenericFirstName) {
    const full = `${p.first_name || ''} ${p.last_name || ''}`.trim()
    return { full_name: full || 'Team Member', position: p.position || null }
  }

  // Use the known employee name map as fallback
  if (known) {
    return { full_name: known.full, position: p.position || known.position || null }
  }

  // Last resort: derive from email local part
  const localPart = email.split('@')[0] || ''
  const derived = localPart.replace(/\d+/g, '').replace(/[._\-+]/g, ' ').trim()
  const words = derived.split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  const full = words.join(' ') || email || 'Team Member'
  return { full_name: full, position: p.position || null }
}

export async function getEmployeesForSearch(): Promise<EmployeeOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, department, position, avatar_url')
    .eq('is_active', true)
    .order('email', { ascending: true })
  if (error) throw error
  return (data || []).map((p: any) => {
    const { full_name, position } = resolveEmployeeName(p)
    return {
      id: p.id,
      full_name,
      department: p.department || null,
      position: position || p.position || null,
      avatar_url: p.avatar_url || null,
    } as EmployeeOption
  }).sort((a, b) => a.full_name.localeCompare(b.full_name))
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchCommunications(
  query: string,
  profileId: string
): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) return []
  const supabase = await createClient()
  const q = `%${query}%`
  const results: SearchResult[] = []

  // Channel messages
  const { data: chanMsgs } = await supabase
    .from('channel_messages')
    .select(`id, content, created_at, department_channels!inner(id, name)`)
    .ilike('content', q)
    .eq('is_deleted', false)
    .limit(5)
  for (const m of chanMsgs || []) {
    results.push({
      id: m.id,
      type: 'channel_message',
      title: (m.content || '').substring(0, 120),
      excerpt: `in #${(m as any).department_channels?.name}`,
      timestamp: m.created_at,
      href: `/communication/channels/${(m as any).department_channels?.id}`,
    })
  }

  // DMs
  const { data: dms } = await supabase
    .from('messages')
    .select(`id, content, created_at, conversation_id`)
    .ilike('content', q)
    .eq('is_deleted', false)
    .limit(5)
  for (const m of dms || []) {
    results.push({
      id: m.id,
      type: 'message',
      title: (m.content || '').substring(0, 120),
      excerpt: 'Direct message',
      timestamp: m.created_at,
      href: `/communication/dm/${m.conversation_id}`,
    })
  }

  // Announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, published_at')
    .or(`title.ilike.${q},content.ilike.${q}`)
    .eq('is_draft', false)
    .limit(5)
  for (const a of announcements || []) {
    results.push({
      id: a.id,
      type: 'announcement',
      title: a.title,
      excerpt: a.content.substring(0, 100),
      timestamp: a.published_at,
      href: '/communication/announcements',
    })
  }

  // Tasks
  const { data: tasks } = await supabase
    .from('tasks_from_messages')
    .select('id, title, status, created_at')
    .ilike('title', q)
    .eq('assigned_to', profileId)
    .limit(5)
  for (const t of tasks || []) {
    results.push({
      id: t.id,
      type: 'task',
      title: t.title,
      excerpt: `Status: ${t.status}`,
      timestamp: t.created_at,
      href: '/communication/tasks',
    })
  }

  // Meetings
  const { data: meetings } = await supabase
    .from('meeting_rooms')
    .select('id, title, meeting_date, status')
    .ilike('title', q)
    .limit(5)
  for (const m of meetings || []) {
    results.push({
      id: m.id,
      type: 'meeting',
      title: m.title,
      excerpt: `${m.meeting_date} · ${m.status}`,
      timestamp: m.meeting_date,
      href: '/communication/meetings',
    })
  }

  // Employees
  const { data: employees } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, department, position')
    .or(`first_name.ilike.${q},last_name.ilike.${q}`)
    .limit(5)
  for (const e of (employees || []) as any[]) {
    const eName = `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Unknown'
    results.push({
      id: e.id,
      type: 'employee',
      title: eName,
      excerpt: `${e.position || ''} · ${e.department || ''}`.trim(),
      timestamp: null,
      href: `/communication/dm`,
    })
  }

  return results.slice(0, 20)
}

// ─── Presence ─────────────────────────────────────────────────────────────────

export async function updateUserPresence(
  profileId: string,
  status: 'online' | 'away' | 'offline'
) {
  const supabase = await createClient()
  await supabase.from('user_presence').upsert({
    profile_id: profileId,
    status,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}

export async function getOnlinePresence(): Promise<{ profile_id: string; status: string }[]> {
  const supabase = await createClient()
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('user_presence')
    .select('profile_id, status')
    .in('status', ['online', 'away'])
    .gte('last_seen_at', tenMinutesAgo)
  return data || []
}

// ─── Super Admin Department Overview ──────────────────────────────────────────

export async function getSuperAdminDepartmentOverview() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const departments = ['sales', 'operations', 'finance', 'hr', 'marketing', 'management']

  const overview = await Promise.all(
    departments.map(async (dept) => {
      const { count: employees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('department', dept)
        .eq('is_active', true)

      const { count: channels } = await supabase
        .from('department_channels')
        .select('*', { count: 'exact', head: true })
        .ilike('name', `%${dept}%`)

      const { count: pendingTasks } = await supabase
        .from('tasks_from_messages')
        .select('*, profiles:assigned_to!inner(department)', { count: 'exact', head: true })
        .eq('profiles.department', dept)
        .in('status', ['pending', 'in_progress'])

      const { count: upcomingMeetings } = await supabase
        .from('meeting_rooms')
        .select('*, profiles:organizer_id!inner(department)', { count: 'exact', head: true })
        .eq('profiles.department', dept)
        .gte('meeting_date', today)
        .lte('meeting_date', weekFromNow)
        .eq('status', 'scheduled')

      return {
        department: dept,
        employees: employees || 0,
        channels: channels || 0,
        pendingTasks: pendingTasks || 0,
        upcomingMeetings: upcomingMeetings || 0,
      }
    })
  )

  return overview
}
