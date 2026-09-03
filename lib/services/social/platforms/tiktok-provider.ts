/**
 * TikTok Platform Provider
 * Server-side ONLY — never import from client components.
 *
 * Uses TikTok Login Kit v2 OAuth and Content Posting API / User Info API.
 *
 * Available scopes (standard app, no additional review):
 *   user.info.basic    — open_id, union_id, avatar_url, display_name
 *   user.info.profile  — username (unique ID shown on profile)
 *   user.info.stats    — follower_count, following_count, likes_count, video_count
 *   video.list         — list user's public videos with basic metrics
 *
 * NOTE on metrics availability:
 *   - followers: ✓ (user.info.stats scope)
 *   - likes (total on all videos): ✓ (user.info.stats scope)
 *   - reach / impressions: ✗ (requires Research API — separate approval)
 *   - profile_views: ✗ (not exposed in standard Login Kit)
 *   - per-video: views, likes, comments, shares ✓ (video.list)
 */

import type {
  SocialProvider,
  TokenSet,
  AccountInfo,
  ProfileMetrics,
  PostData,
  PostMetrics,
  CommentData,
  FollowerHistoryPoint,
  SyncDateRange,
} from '../social-provider'
import type { PlatformCapabilities } from '@/types/marketing'

const TIKTOK_OAUTH_BASE = 'https://www.tiktok.com/v2/auth/authorize/'
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_REVOKE_URL = 'https://open.tiktokapis.com/v2/oauth/revoke/'
const TIKTOK_USER_URL = 'https://open.tiktokapis.com/v2/user/info/'
const TIKTOK_VIDEO_URL = 'https://open.tiktokapis.com/v2/video/list/'

const REQUIRED_SCOPES = [
  'user.info.basic',
  'user.info.profile',
  'user.info.stats',
  'video.list',
]

export class TikTokProvider implements SocialProvider {
  readonly platform = 'tiktok' as const

  private get clientKey() {
    const k = process.env.TIKTOK_CLIENT_KEY
    if (!k) throw new Error('TIKTOK_CLIENT_KEY environment variable is not set')
    return k
  }

  private get clientSecret() {
    const s = process.env.TIKTOK_CLIENT_SECRET
    if (!s) throw new Error('TIKTOK_CLIENT_SECRET environment variable is not set')
    return s
  }

  // ============================================================================
  // OAuth
  // ============================================================================

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_key: this.clientKey,
      scope: REQUIRED_SCOPES.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    })
    return `${TIKTOK_OAUTH_BASE}?${params.toString()}`
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const body = new URLSearchParams({
      client_key: this.clientKey,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })

    const res = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
      body: body.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`TikTok token exchange failed (${res.status}): ${text}`)
    }

    const json = await res.json()
    if (json.error) {
      throw new Error(`TikTok token exchange error: ${json.error} — ${json.error_description}`)
    }

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : undefined,
      scopes: (json.scope as string | undefined)?.split(',') ?? REQUIRED_SCOPES,
    }
  }

  async refreshToken(refreshTokenValue: string): Promise<TokenSet> {
    const body = new URLSearchParams({
      client_key: this.clientKey,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    })

    const res = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
      body: body.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`TikTok token refresh failed (${res.status}): ${text}`)
    }

    const json = await res.json()
    if (json.error) {
      throw new Error(`TikTok token refresh error: ${json.error} — ${json.error_description}`)
    }

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? refreshTokenValue,
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : undefined,
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    const body = new URLSearchParams({
      client_key: this.clientKey,
      client_secret: this.clientSecret,
      token: accessToken,
    })
    // Best-effort revoke — don't throw if it fails (token may already be expired)
    try {
      await fetch(TIKTOK_REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
    } catch {
      // Log but don't rethrow — local disconnect continues even if remote revoke fails
      console.warn('[TikTok] Token revocation request failed (non-fatal)')
    }
  }

  // ============================================================================
  // Account Info
  // ============================================================================

  async getAccount(accessToken: string): Promise<AccountInfo> {
    const fields = [
      'open_id',
      'union_id',
      'avatar_url',
      'display_name',
      'username',
      'follower_count',
      'following_count',
      'likes_count',
      'video_count',
    ].join(',')

    const res = await fetch(`${TIKTOK_USER_URL}?fields=${fields}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    if (res.status === 403) throw new Error('PERMISSION_DENIED: Missing required scopes for user.info.stats')
    if (res.status === 429) throw new Error('RATE_LIMITED')
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`TikTok user info failed (${res.status}): ${text}`)
    }

    const json = await res.json()
    if (json.error?.code && json.error.code !== 'ok') {
      throw new Error(`TikTok API error: ${json.error.code} — ${json.error.message}`)
    }

    const user = json.data?.user
    if (!user) throw new Error('TikTok API returned no user data')

    return {
      externalId: user.open_id,
      username: user.username ?? user.display_name ?? '',
      accountName: user.display_name ?? user.username ?? 'TikTok Account',
      profileUrl: user.username ? `https://www.tiktok.com/@${user.username}` : undefined,
      avatarUrl: user.avatar_url,
      followersCount: user.follower_count,
    }
  }

  // ============================================================================
  // Profile Metrics
  // Returns one ProfileMetrics snapshot (today's snapshot from user.info.stats)
  // TikTok does not expose historical follower counts via Login Kit.
  // ============================================================================

  async getProfileMetrics(
    accessToken: string,
    _externalAccountId: string,
    _dateRange: SyncDateRange
  ): Promise<ProfileMetrics[]> {
    const fields = [
      'open_id',
      'follower_count',
      'following_count',
      'likes_count',
      'video_count',
    ].join(',')

    const res = await fetch(`${TIKTOK_USER_URL}?fields=${fields}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    if (res.status === 429) throw new Error('RATE_LIMITED')
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`TikTok profile metrics failed (${res.status}): ${text}`)
    }

    const json = await res.json()
    const user = json.data?.user
    if (!user) return []

    return [
      {
        date: new Date(),
        followers: user.follower_count ?? undefined,
        // likes_count is total likes across ALL videos (TikTok-specific)
        // Stored in social_account_metrics.likes_total via sync service
        likes: user.likes_count ?? undefined,
        // reach / impressions: NOT AVAILABLE in standard Login Kit
        // requires Research API (separate app review)
        reach: undefined,
        impressions: undefined,
        profileViews: undefined,  // NOT AVAILABLE in standard Login Kit
        engagements: undefined,
      },
    ]
  }

  // ============================================================================
  // Posts (video list)
  // ============================================================================

  async getPosts(
    accessToken: string,
    _externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<PostData[]> {
    const fields = [
      'id',
      'title',
      'create_time',
      'cover_image_url',
      'share_url',
      'video_description',
      'duration',
      'like_count',
      'comment_count',
      'share_count',
      'view_count',
    ].join(',')

    const posts: PostData[] = []
    let cursor: number | undefined = undefined
    let hasMore = true
    const maxPages = 10  // safety limit — 20 videos/page = 200 videos max

    for (let page = 0; page < maxPages && hasMore; page++) {
      const body: Record<string, unknown> = {
        max_count: 20,
        fields: fields.split(','),
      }
      if (cursor !== undefined) body.cursor = cursor

      const res = await fetch(TIKTOK_VIDEO_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (res.status === 401) throw new Error('TOKEN_EXPIRED')
      if (res.status === 429) throw new Error('RATE_LIMITED')
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`TikTok video list failed (${res.status}): ${text}`)
      }

      const json = await res.json()
      const videoList: Record<string, unknown>[] = json.data?.videos ?? []
      hasMore = json.data?.has_more ?? false
      cursor = json.data?.cursor

      for (const v of videoList) {
        const publishedAt = new Date((v.create_time as number) * 1000)

        // Only include videos within the date range
        if (publishedAt < dateRange.from || publishedAt > dateRange.to) {
          // If video is before the range start, stop paginating (videos are newest-first)
          if (publishedAt < dateRange.from) {
            hasMore = false
            break
          }
          continue
        }

        const likes = (v.like_count as number) ?? 0
        const comments = (v.comment_count as number) ?? 0
        const shares = (v.share_count as number) ?? 0
        const views = (v.view_count as number) ?? 0

        posts.push({
          externalPostId: v.id as string,
          platform: 'tiktok',
          postUrl: v.share_url as string | undefined,
          contentType: 'video',
          caption: (v.video_description as string) || (v.title as string) || undefined,
          thumbnailUrl: v.cover_image_url as string | undefined,
          publishedAt,
          likesCount: likes,
          commentsCount: comments,
          sharesCount: shares,
          viewsCount: views,
          videoViewsCount: views,
          // reach/impressions not available via Login Kit
          reachCount: 0,
          impressionsCount: 0,
          engagementCount: likes + comments + shares,
          engagementRate:
            views > 0
              ? Math.round(((likes + comments + shares) / views) * 10000) / 100
              : undefined,
        })
      }
    }

    return posts
  }

  async getPostMetrics(accessToken: string, externalPostId: string): Promise<PostMetrics> {
    // TikTok video.list already returns metrics — this is used for refresh
    const body = {
      filters: { video_ids: [externalPostId] },
      fields: ['id', 'like_count', 'comment_count', 'share_count', 'view_count'],
      max_count: 1,
    }

    const res = await fetch(TIKTOK_VIDEO_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`TikTok getPostMetrics failed (${res.status})`)

    const json = await res.json()
    const v = json.data?.videos?.[0]
    if (!v) throw new Error(`Video ${externalPostId} not found in TikTok response`)

    const likes = (v.like_count as number) ?? 0
    const comments = (v.comment_count as number) ?? 0
    const shares = (v.share_count as number) ?? 0
    const views = (v.view_count as number) ?? 0

    return {
      externalPostId,
      likesCount: likes,
      commentsCount: comments,
      sharesCount: shares,
      viewsCount: views,
      videoViewsCount: views,
      reachCount: 0,       // not available
      impressionsCount: 0, // not available
      engagementCount: likes + comments + shares,
    }
  }

  async getComments(_accessToken: string, _externalPostId: string): Promise<CommentData[]> {
    // TikTok Comment API requires additional permissions (comment.list.read)
    // which are subject to additional review. Return empty for now and surface
    // this in the UI as "Not available through current API permissions."
    return []
  }

  async getFollowerHistory(
    _accessToken: string,
    _externalAccountId: string,
    _dateRange: SyncDateRange
  ): Promise<FollowerHistoryPoint[]> {
    // TikTok Login Kit does not expose historical follower data.
    // Only the current snapshot is available via user.info.stats.
    return []
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: 'tiktok',
      followers: true,
      follower_growth: true,      // calculated from stored snapshots over time
      likes: true,                // total likes across all videos
      comments: true,             // per-video only
      shares: true,               // per-video only
      views: true,                // per-video view count
      reach: 'tier',             // Research API — separate approval required
      impressions: 'tier',       // Research API — separate approval required
      engagements: true,
      engagement_rate: true,
      profile_views: false,       // not available in standard Login Kit
      video_views: true,
      mentions: false,
      post_metrics: true,
      webhooks: false,
    }
  }
}
