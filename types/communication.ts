import { z } from 'zod'

// Conversation Types
export type ConversationType = 'direct' | 'booking' | 'customer' | 'supplier'

export interface Conversation {
  id: string
  type: ConversationType
  title?: string
  booking_id?: string
  customer_id?: string
  supplier_id?: string
  created_by?: string
  is_archived: boolean
  last_message_at: string
  created_at: string
}

export interface ConversationMember {
  id: string
  conversation_id: string
  profile_id: string
  role: 'member' | 'admin'
  joined_at: string
  last_read_at?: string
  is_muted: boolean
}

// Message Types
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content?: string
  type: 'text' | 'voice' | 'image' | 'file'
  parent_id?: string
  is_edited: boolean
  is_deleted: boolean
  is_pinned: boolean
  pinned_by?: string
  pinned_at?: string
  forwarded_from?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MessageRead {
  id: string
  message_id: string
  profile_id: string
  read_at: string
}

export interface MessageReaction {
  id: string
  message_id: string
  profile_id: string
  emoji: string
  created_at: string
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size_kb?: number
  duration_seconds?: number
  uploaded_by?: string
  created_at: string
}

// Channel Types
export interface DepartmentChannel {
  id: string
  name: string
  description?: string
  icon?: string
  is_private: boolean
  is_readonly: boolean
  created_by?: string
  created_at: string
}

export interface DepartmentChannelMember {
  id: string
  channel_id: string
  profile_id: string
  role: 'member' | 'moderator'
  joined_at: string
  last_read_at?: string
}

export interface ChannelMessage {
  id: string
  channel_id: string
  sender_id: string
  content?: string
  type: 'text' | 'voice' | 'image' | 'file'
  parent_id?: string
  is_edited: boolean
  is_deleted: boolean
  is_pinned: boolean
  pinned_by?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// Announcement Types
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent' | 'emergency'
export type AnnouncementCategory = 
  | 'general' 
  | 'payroll_completed' 
  | 'holiday_notice' 
  | 'company_policy' 
  | 'office_meeting' 
  | 'training' 
  | 'visa_regulation' 
  | 'emergency'

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  category: AnnouncementCategory
  target_roles: string[]
  published_by?: string
  published_at?: string
  expires_at?: string
  is_draft: boolean
  requires_acknowledgement: boolean
  created_at: string
  updated_at: string
}

export interface AnnouncementRead {
  id: string
  announcement_id: string
  profile_id: string
  acknowledged_at: string
}

// Notification Preferences
export interface NotificationPreferences {
  id: string
  profile_id: string
  direct_messages: boolean
  mentions: boolean
  channel_messages: boolean
  announcements: boolean
  booking_discussions: boolean
  task_assignments: boolean
  meeting_invitations: boolean
  poll_created: boolean
  email_notifications: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  updated_at: string
}

// Task Types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface TaskFromMessage {
  id: string
  message_id?: string
  title: string
  description?: string
  assigned_to?: string
  assigned_by?: string
  priority: TaskPriority
  due_date?: string
  status: TaskStatus
  booking_id?: string
  customer_id?: string
  created_at: string
  updated_at: string
}

// Poll Types
export interface Poll {
  id: string
  conversation_id?: string
  channel_id?: string
  created_by?: string
  question: string
  is_anonymous: boolean
  is_multiple_choice: boolean
  closes_at?: string
  is_closed: boolean
  created_at: string
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  sort_order: number
}

export interface PollVote {
  id: string
  poll_id: string
  option_id: string
  profile_id: string
  created_at: string
}

// Meeting Types
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type MeetingParticipantStatus = 'invited' | 'accepted' | 'declined' | 'tentative'

export interface MeetingRoom {
  id: string
  title: string
  description?: string
  agenda?: string
  organizer_id: string
  meeting_date: string
  start_time: string
  end_time?: string
  meeting_link?: string
  location?: string
  status: MeetingStatus
  notes?: string
  booking_id?: string
  created_at: string
  updated_at: string
}

export interface MeetingParticipant {
  id: string
  meeting_id: string
  profile_id: string
  status: MeetingParticipantStatus
  responded_at?: string
}

// User Presence
export type UserPresenceStatus = 'online' | 'busy' | 'away' | 'offline' | 'in_meeting'

export interface UserPresence {
  id: string
  profile_id: string
  status: UserPresenceStatus
  last_seen_at: string
  custom_status?: string
  updated_at: string
}

// Message Bookmark
export interface MessageBookmark {
  id: string
  profile_id: string
  message_id: string
  created_at: string
}

// Message Mention
export interface MessageMention {
  id: string
  message_id: string
  mentioned_profile_id: string
  is_read: boolean
  created_at: string
}

// Validation Schemas
export const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'voice', 'image', 'file']).default('text'),
  parent_id: z.string().uuid().optional(),
})

export const channelMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'voice', 'image', 'file']).default('text'),
  parent_id: z.string().uuid().optional(),
})

export const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'emergency']).default('normal'),
  category: z.enum([
    'general', 'payroll_completed', 'holiday_notice', 'company_policy',
    'office_meeting', 'training', 'visa_regulation', 'emergency'
  ]).default('general'),
  target_roles: z.array(z.string()).default([]),
  requires_acknowledgement: z.boolean().default(false),
  expires_at: z.string().datetime().optional(),
})

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional(),
  booking_id: z.string().optional(),
  customer_id: z.string().uuid().optional(),
})

export const meetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  meeting_date: z.string(),
  start_time: z.string(),
  end_time: z.string().optional(),
  meeting_link: z.string().url().optional(),
  location: z.string().optional(),
  agenda: z.string().max(5000).optional(),
})
