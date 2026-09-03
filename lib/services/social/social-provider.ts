/**
 * Social Provider Interface
 * Common contract that all platform implementations must fulfill.
 * Each platform only implements the capabilities its API actually supports.
 */

import type { SocialPlatform, PlatformCapabilities } from '@/types/marketing'

// ============================================================================
// SHARED DATA SHAPES (normalized across platforms)
// ============================================================================

export interface TokenSet {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date       // undefined = non-expiring (e.g. Meta long-lived page tokens)
  scopes?: string[]
}

export interface AccountInfo {
  externalId: string
  username: string
  accountName: string
  profileUrl?: string
  avatarUrl?: string
  followersCount?: number
}

export interface ProfileMetrics {
  date: Date
  followers?: number
  followerGrowth?: number
  reach?: number
  impressions?: number
  profileViews?: number
  engagements?: number
  engagementRate?: number
  videoViews?: number
  likes?: number
  comments?: number
  shares?: number
  views?: number
}

export interface PostData {
  externalPostId: string
  platform: SocialPlatform
  postUrl?: string
  contentType: string      // image/video/carousel/reel/story/text
  caption?: string
  thumbnailUrl?: string
  publishedAt: Date
  likesCount: number
  commentsCount: number
  sharesCount: number
  viewsCount: number
  videoViewsCount: number
  reachCount: number
  impressionsCount: number
  engagementCount: number
  engagementRate?: number
}

export interface PostMetrics {
  externalPostId: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  viewsCount: number
  videoViewsCount: number
  reachCount: number
  impressionsCount: number
  engagementCount: number
  engagementRate?: number
}

export interface CommentData {
  externalCommentId: string
  externalPostId: string
  authorName: string
  content: string
  reactionCount: number
  publishedAt: Date
  postUrl?: string
}

export interface FollowerHistoryPoint {
  date: Date
  followers: number
}

export interface SyncDateRange {
  from: Date
  to: Date
}

// ============================================================================
// PLATFORM PROVIDER INTERFACE
// ============================================================================

export interface SocialProvider {
  readonly platform: SocialPlatform

  /** Generate the OAuth redirect URL for this platform */
  getAuthUrl(state: string, redirectUri: string): string

  /** Exchange authorization code for tokens (server-side only) */
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>

  /** Refresh an expired access token */
  refreshToken(refreshTokenValue: string): Promise<TokenSet>

  /** Revoke an access token on the platform (where supported) */
  revokeToken(accessToken: string): Promise<void>

  /** Fetch account/page metadata from the platform */
  getAccount(accessToken: string, externalAccountId?: string): Promise<AccountInfo>

  /** Get aggregate profile metrics for a date range */
  getProfileMetrics(
    accessToken: string,
    externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<ProfileMetrics[]>

  /** List posts published in the date range */
  getPosts(
    accessToken: string,
    externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<PostData[]>

  /** Get per-post metrics (call after getting post list) */
  getPostMetrics(
    accessToken: string,
    externalPostId: string
  ): Promise<PostMetrics>

  /** Get comments on a specific post */
  getComments(
    accessToken: string,
    externalPostId: string
  ): Promise<CommentData[]>

  /** Get follower history (for initial historical sync) */
  getFollowerHistory(
    accessToken: string,
    externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<FollowerHistoryPoint[]>

  /** Declare exactly which metrics this platform's API actually provides */
  getCapabilities(): PlatformCapabilities
}

// ============================================================================
// CAPABILITY MATRIX — shared reference for UI "N/A" display
// ============================================================================

export const PLATFORM_CAPABILITY_MATRIX: Record<SocialPlatform, PlatformCapabilities> = {
  instagram: {
    platform: 'instagram',
    followers: true,
    follower_growth: true,
    likes: true,
    comments: true,
    shares: false,          // Instagram does not expose shares via basic API
    views: true,
    reach: true,            // requires Business/Creator account
    impressions: true,      // requires Business/Creator account
    engagements: true,
    engagement_rate: true,
    profile_views: true,    // requires Business account
    video_views: true,
    mentions: 'tier',       // Business Discovery API — higher tier
    post_metrics: true,
    webhooks: true,         // Meta webhooks supported
  },
  facebook: {
    platform: 'facebook',
    followers: true,
    follower_growth: true,
    likes: true,
    comments: true,
    shares: true,
    views: true,
    reach: true,
    impressions: true,
    engagements: true,
    engagement_rate: true,
    profile_views: true,
    video_views: true,
    mentions: false,
    post_metrics: true,
    webhooks: true,
  },
  tiktok: {
    platform: 'tiktok',
    followers: true,
    follower_growth: true,
    likes: true,
    comments: true,
    shares: true,
    views: true,
    reach: 'tier',          // requires Research API approval
    impressions: 'tier',    // requires Research API approval
    engagements: true,
    engagement_rate: true,
    profile_views: false,
    video_views: true,
    mentions: false,
    post_metrics: true,
    webhooks: false,        // not available in standard Login Kit
  },
  linkedin: {
    platform: 'linkedin',
    followers: true,
    follower_growth: true,
    likes: true,
    comments: true,
    shares: true,
    views: false,
    reach: false,
    impressions: true,
    engagements: true,
    engagement_rate: true,
    profile_views: true,    // page views
    video_views: false,
    mentions: false,
    post_metrics: true,
    webhooks: false,        // LinkedIn org webhooks are limited / approval-gated
  },
  // Non-targeted platforms — stubbed
  youtube: {
    platform: 'youtube', followers: false, follower_growth: false,
    likes: false, comments: false, shares: false, views: false,
    reach: false, impressions: false, engagements: false,
    engagement_rate: false, profile_views: false, video_views: false,
    mentions: false, post_metrics: false, webhooks: false,
  },
  twitter: {
    platform: 'twitter', followers: false, follower_growth: false,
    likes: false, comments: false, shares: false, views: false,
    reach: false, impressions: false, engagements: false,
    engagement_rate: false, profile_views: false, video_views: false,
    mentions: false, post_metrics: false, webhooks: false,
  },
  telegram: {
    platform: 'telegram', followers: false, follower_growth: false,
    likes: false, comments: false, shares: false, views: false,
    reach: false, impressions: false, engagements: false,
    engagement_rate: false, profile_views: false, video_views: false,
    mentions: false, post_metrics: false, webhooks: false,
  },
  whatsapp: {
    platform: 'whatsapp', followers: false, follower_growth: false,
    likes: false, comments: false, shares: false, views: false,
    reach: false, impressions: false, engagements: false,
    engagement_rate: false, profile_views: false, video_views: false,
    mentions: false, post_metrics: false, webhooks: false,
  },
}

/** Human-readable label for a MetricSupport value */
export function capabilityLabel(support: boolean | 'tier'): string {
  if (support === true) return '✓ Available'
  if (support === 'tier') return '⊛ API tier dependent'
  return 'Not available from this platform/API'
}
