import { z } from 'zod'

// ============================================================================
// PLATFORM & STATUS TYPES
// ============================================================================

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'telegram'
  | 'whatsapp'

export type AccountStatus = 'connected' | 'disconnected' | 'suspended' | 'pending'
export type ApiStatus = 'active' | 'rate_limited' | 'error' | 'expired'

export type PostStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'archived' | 'rejected'
export type ContentType = 'image' | 'video' | 'carousel' | 'reel' | 'story' | 'short' | 'live' | 'text'

export type CampaignStatus = 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
export type CampaignType =
  | 'holiday_promotion'
  | 'visa_promotion'
  | 'tour_package'
  | 'flight_deals'
  | 'hotel_offers'
  | 'seasonal_promotion'
  | 'brand_awareness'

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
export type CommentSentiment = 'positive' | 'neutral' | 'negative'
export type CommentPriority = 'low' | 'normal' | 'high' | 'urgent'

export type AdPlatform = 'meta' | 'google' | 'tiktok' | 'linkedin'
export type AdStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'

export type ProductionStatus =
  | 'requested'
  | 'planning'
  | 'approved'
  | 'recording'
  | 'editing'
  | 'review'
  | 'scheduled'
  | 'published'
  | 'archived'

export type WeeklyPlanStatus = 'draft' | 'in_progress' | 'planned' | 'recording' | 'editing' | 'ready' | 'published' | 'missed'

export type EmployeeContentStatusType =
  | 'available'
  | 'recording'
  | 'editing'
  | 'meeting'
  | 'field_work'
  | 'leave'
  | 'offline'

export type MediaFileType = 'image' | 'video' | 'logo' | 'document' | 'template'

export type MarketingReportType =
  | 'marketing_report'
  | 'campaign_report'
  | 'social_media_report'
  | 'advertising_report'
  | 'roi_report'
  | 'lead_report'
  | 'employee_performance_report'

export type InfluencerPaymentStatus = 'pending' | 'paid' | 'cancelled'

export type MarketingTaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type MarketingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// ============================================================================
// SOCIAL MEDIA TEAM ROLES
// ============================================================================

export type SocialMediaRole =
  | 'Social Media Manager'
  | 'Senior Social Media Officer'
  | 'Social Media Officer'
  | 'Content Creator'
  | 'Videographer'
  | 'Photographer'
  | 'Video Editor'
  | 'Graphic Designer'
  | 'Community Manager'
  | 'Copywriter'
  | 'Presenter/Host'
  | 'Digital Marketing Specialist'
  | 'Marketing Manager'

// ============================================================================
// DATABASE INTERFACES
// ============================================================================

export interface SocialAccount {
  id: string
  platform: SocialPlatform
  account_name: string
  profile_url: string | null
  followers_count: number
  status: AccountStatus
  account_manager_id: string | null
  account_manager_name?: string
  last_sync_at: string | null
  api_status: ApiStatus
  created_at: string
}

export interface SocialPost {
  id: string
  account_id: string | null
  campaign_id: string | null
  content_type: ContentType
  caption: string | null
  media_urls: string[]
  status: PostStatus
  scheduled_for: string | null
  published_at: string | null
  approved_by: string | null
  created_by: string | null
  is_top_performing: boolean
  engagement_count: number
  reach_count: number
  impressions_count: number
  likes_count: number
  shares_count: number
  comments_count: number
  clicks_count: number
  created_at: string
  updated_at: string
  // Joined fields
  account_name?: string
  account_platform?: string
  campaign_name?: string
  creator_name?: string
  approver_name?: string
}

export interface SocialCampaign {
  id: string
  name: string
  budget: number
  start_date: string
  end_date: string
  target_audience: string | null
  objective: string | null
  campaign_type: CampaignType
  status: CampaignStatus
  expected_leads: number
  actual_leads: number
  roi: number | null
  created_by: string | null
  created_at: string
  // Joined
  creator_name?: string
  platforms?: SocialAccount[]
  posts_count?: number
}

export interface CampaignPlatform {
  id: string
  campaign_id: string
  account_id: string
}

export interface ScheduledPost {
  id: string
  post_id: string
  scheduled_datetime: string
  status: 'pending' | 'published' | 'failed' | 'cancelled'
  failure_reason: string | null
  created_at: string
}

export interface SocialLead {
  id: string
  lead_id: string | null
  platform: SocialPlatform
  campaign_id: string | null
  ad_reference: string | null
  source: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  assigned_agent_id: string | null
  status: LeadStatus
  converted: boolean
  notes: string | null
  created_at: string
  // Joined
  campaign_name?: string
  agent_name?: string
}

export interface SocialComment {
  id: string
  account_id: string | null
  post_id: string | null
  author_name: string | null
  content: string | null
  sentiment: CommentSentiment | null
  priority: CommentPriority
  is_replied: boolean
  replied_by: string | null
  replied_at: string | null
  reply_content: string | null
  created_at: string
  // Joined
  account_name?: string
  post_caption?: string
  replier_name?: string
}

export interface SocialMessage {
  id: string
  account_id: string | null
  sender_name: string | null
  content: string | null
  response_time_minutes: number | null
  is_answered: boolean
  answered_by: string | null
  response_content: string | null
  created_at: string
  // Joined
  account_name?: string
  answerer_name?: string
}

export interface Advertisement {
  id: string
  campaign_id: string | null
  name: string
  platform: AdPlatform
  ad_type: string
  budget: number
  spend: number
  status: AdStatus
  start_date: string | null
  end_date: string | null
  target_audience: string | null
  created_by: string | null
  created_at: string
  // Joined
  campaign_name?: string
  metrics?: AdvertisementMetric[]
}

export interface AdvertisementMetric {
  id: string
  advertisement_id: string
  date: string
  impressions: number
  clicks: number
  ctr: number | null
  cpc: number | null
  cpm: number | null
  conversions: number
  roi: number | null
}

export interface Influencer {
  id: string
  name: string
  platform: SocialPlatform
  handle: string | null
  followers_count: number
  category: string | null
  country: string | null
  campaign_id: string | null
  contract_url: string | null
  payment_amount: number | null
  payment_status: InfluencerPaymentStatus
  performance_notes: string | null
  status: string
  created_at: string
  // Joined
  campaign_name?: string
}

export interface MediaLibraryItem {
  id: string
  file_name: string
  file_url: string
  file_type: MediaFileType
  file_size_kb: number | null
  campaign_id: string | null
  category: string | null
  platform: string | null
  tags: string[]
  uploaded_by: string | null
  created_at: string
  // Joined
  campaign_name?: string
  uploader_name?: string
}

export interface MarketingTask {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  assigned_by: string | null
  campaign_id: string | null
  priority: MarketingTaskPriority
  due_date: string | null
  status: MarketingTaskStatus
  completed_at: string | null
  created_at: string
  // Joined
  assignee_name?: string
  assigner_name?: string
  campaign_name?: string
}

export interface MarketingReport {
  id: string
  report_type: MarketingReportType
  title: string | null
  period_start: string | null
  period_end: string | null
  file_url: string | null
  summary: string | null
  generated_by: string | null
  created_at: string
  // Joined
  generator_name?: string
}

export interface ContentProductionRequest {
  id: string
  title: string
  requesting_department: string
  campaign_id: string | null
  description: string | null
  priority: MarketingTaskPriority
  due_date: string | null
  assigned_team: string[]
  status: ProductionStatus
  recording_date: string | null
  recording_location: string | null
  required_equipment: string | null
  camera_operator_id: string | null
  video_editor_id: string | null
  photographer_id: string | null
  presenter_id: string | null
  requires_travel: boolean
  completion_percent: number
  requested_by: string | null
  created_at: string
  updated_at: string
  // Joined
  campaign_name?: string
  requester_name?: string
  camera_operator_name?: string
  video_editor_name?: string
  photographer_name?: string
  presenter_name?: string
}

export interface WeeklyContentPlan {
  id: string
  week_start_date: string
  day_of_week: number
  content_theme: string
  post_type: string
  content_type?: ContentType
  platform: string | null
  assigned_to: string | null
  status: WeeklyPlanStatus
  caption_draft: string | null
  required_media: string | null
  notes: string | null
  campaign_id: string | null
  created_by: string | null
  created_at: string
  // Joined
  assignee_name?: string
}

export interface EmployeeContentStatus {
  id: string
  employee_id: string
  current_status: EmployeeContentStatusType
  current_task: string | null
  updated_at: string
  // Joined
  employee_name?: string
  position?: string
}

// ============================================================================
// DASHBOARD / ANALYTICS TYPES
// ============================================================================

export interface MarketingDashboardStats {
  totalFollowers: number
  totalReach: number
  totalImpressions: number
  engagementRate: number
  clickThroughRate: number
  conversionRate: number
  newLeads: number
  campaignPerformance: number
  bestPlatform: string
  bestContent: string
  postsPublished: number
  scheduledPosts: number
  pendingApproval: number
  topEmployee: string
}

export interface PlatformMetrics {
  platform: SocialPlatform
  followers: number
  engagement: number
  reach: number
  posts: number
}

export interface ChartDataPoint {
  label: string
  value: number
  value2?: number
}

export interface CampaignROIData {
  name: string
  budget: number
  spend: number
  revenue: number
  roi: number
}

// ============================================================================
// PLATFORM STYLING HELPERS
// ============================================================================

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  telegram: '#26A5E4',
  whatsapp: '#25D366',
}

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp Business',
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  holiday_promotion: 'Holiday Promotion',
  visa_promotion: 'Visa Promotion',
  tour_package: 'Tour Package',
  flight_deals: 'Flight Deals',
  hotel_offers: 'Hotel Offers',
  seasonal_promotion: 'Seasonal Promotion',
  brand_awareness: 'Brand Awareness',
}

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  requested: 'Requested',
  planning: 'Planning',
  approved: 'Approved',
  recording: 'Recording',
  editing: 'Editing',
  review: 'Review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
}

export const PRODUCTION_STATUS_COLORS: Record<ProductionStatus, string> = {
  requested: '#F59E0B',
  planning: '#3B82F6',
  approved: '#10B981',
  recording: '#EF4444',
  editing: '#8B5CF6',
  review: '#F97316',
  scheduled: '#06B6D4',
  published: '#22C55E',
  archived: '#6B7280',
}

export const WEEKLY_STATUS_COLORS: Record<WeeklyPlanStatus, string> = {
  draft: '#9CA3AF',
  in_progress: '#F59E0B',
  planned: '#3B82F6',
  recording: '#EF4444',
  editing: '#8B5CF6',
  ready: '#10B981',
  published: '#22C55E',
  missed: '#DC2626',
}

export const CONTENT_STATUS_COLORS: Record<EmployeeContentStatusType, string> = {
  available: '#22C55E',
  recording: '#EF4444',
  editing: '#8B5CF6',
  meeting: '#F59E0B',
  field_work: '#3B82F6',
  leave: '#6B7280',
  offline: '#9CA3AF',
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const socialAccountSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'twitter', 'telegram', 'whatsapp']),
  account_name: z.string().min(1, 'Account name is required').max(200),
  profile_url: z.string().url().optional().or(z.literal('')),
  followers_count: z.coerce.number().int().min(0).default(0),
  status: z.enum(['connected', 'disconnected', 'suspended', 'pending']).default('connected'),
  account_manager_id: z.string().uuid().optional().or(z.literal('')),
})

export const socialPostSchema = z.object({
  account_id: z.string().uuid().optional().or(z.literal('')),
  campaign_id: z.string().uuid().optional().or(z.literal('')),
  content_type: z.enum(['image', 'video', 'carousel', 'reel', 'story', 'short', 'live', 'text']),
  caption: z.string().max(5000).optional(),
  media_urls: z.array(z.string()).default([]),
  scheduled_for: z.string().optional(),
})

export const socialCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  budget: z.coerce.number().min(0).default(0),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  target_audience: z.string().max(500).optional(),
  objective: z.string().max(500).optional(),
  campaign_type: z.enum([
    'holiday_promotion', 'visa_promotion', 'tour_package',
    'flight_deals', 'hotel_offers', 'seasonal_promotion', 'brand_awareness'
  ]),
  expected_leads: z.coerce.number().int().min(0).default(0),
})

export const socialLeadSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'twitter', 'telegram', 'whatsapp']),
  campaign_id: z.string().uuid().optional().or(z.literal('')),
  ad_reference: z.string().max(200).optional(),
  source: z.string().max(200).optional(),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().max(50).optional(),
  assigned_agent_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
})

export const advertisementSchema = z.object({
  campaign_id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().min(1, 'Ad name is required').max(200),
  platform: z.enum(['meta', 'google', 'tiktok', 'linkedin']),
  ad_type: z.string().default('sponsored'),
  budget: z.coerce.number().min(0),
  target_audience: z.string().max(500).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const influencerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'twitter', 'telegram', 'whatsapp']),
  handle: z.string().max(200).optional(),
  followers_count: z.coerce.number().int().min(0).default(0),
  category: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  campaign_id: z.string().uuid().optional().or(z.literal('')),
  payment_amount: z.coerce.number().min(0).optional(),
  performance_notes: z.string().max(2000).optional(),
})

export const contentProductionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  requesting_department: z.string().min(1, 'Department is required'),
  campaign_id: z.string().uuid().optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional(),
  recording_date: z.string().optional(),
  recording_location: z.string().max(300).optional(),
  required_equipment: z.string().max(500).optional(),
  camera_operator_id: z.string().uuid().optional().or(z.literal('')),
  video_editor_id: z.string().uuid().optional().or(z.literal('')),
  photographer_id: z.string().uuid().optional().or(z.literal('')),
  presenter_id: z.string().uuid().optional().or(z.literal('')),
  requires_travel: z.boolean().default(false),
})

export const weeklyPlanSchema = z.object({
  week_start_date: z.string().min(1, 'Week start date is required'),
  day_of_week: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  content_theme: z.string().min(1, 'Theme is required').max(200),
  content_type: z.enum(['image', 'video', 'carousel', 'reel', 'story', 'short', 'live', 'text']),
  platform: z.string().optional(),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
})

export const marketingReportSchema = z.object({
  report_type: z.enum([
    'marketing_report', 'campaign_report', 'social_media_report',
    'advertising_report', 'roi_report', 'lead_report', 'employee_performance_report'
  ]),
  title: z.string().min(1, 'Title is required').max(200),
  period_start: z.string().min(1, 'Period start is required'),
  period_end: z.string().min(1, 'Period end is required'),
  summary: z.string().max(5000).optional(),
})
