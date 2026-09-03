/**
 * Instagram Platform Provider
 * Server-side ONLY — never import from client components.
 *
 * Uses Meta Graph API for Instagram Business/Creator accounts.
 * Requires the account to be a Professional (Business or Creator) account
 * connected to a Facebook Page that is managed by your Meta App.
 *
 * Available via Graph API (standard permissions):
 *   instagram_basic         — account info, media list
 *   instagram_manage_insights — profile insights (reach, impressions, etc.)
 *   pages_show_list         — list Pages user manages (needed to find IG account)
 *
 * OAuth flow:
 *   1. User logs in with Facebook OAuth (Meta handles both FB + IG auth)
 *   2. Get user's connected Instagram Business Account via Graph API
 *   3. Exchange for long-lived token (60 days) — refresh is token exchange
 *
 * Metric availability:
 *   followers:    ✓ (followers_count field on IG account)
 *   reach:        ✓ (instagram_manage_insights — online_followers, reach)
 *   impressions:  ✓ (instagram_manage_insights)
 *   likes:        ✓ (per-media)
 *   comments:     ✓ (per-media)
 *   shares:       ✗ (Instagram does not expose share counts via API)
 *   video_views:  ✓ (video_views field on media)
 *   profile_views: ✓ (profile_views insight metric)
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

const META_OAUTH_BASE = 'https://www.facebook.com/v19.0/dialog/oauth'
const META_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token'
const META_GRAPH_BASE = 'https://graph.facebook.com/v19.0'

const REQUIRED_SCOPES = [
  'instagram_basic',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
]

export class InstagramProvider implements SocialProvider {
  readonly platform = 'instagram' as const

  private get appId() {
    const id = process.env.META_APP_ID
    if (!id) throw new Error('META_APP_ID environment variable is not set')
    return id
  }

  private get appSecret() {
    const s = process.env.META_APP_SECRET
    if (!s) throw new Error('META_APP_SECRET environment variable is not set')
    return s
  }

  // ============================================================================
  // OAuth
  // ============================================================================

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: REQUIRED_SCOPES.join(','),
      response_type: 'code',
      state,
    })
    return `${META_OAUTH_BASE}?${params.toString()}`
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    // Step 1: Short-lived token
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri,
      code,
    })

    const res = await fetch(`${META_TOKEN_URL}?${params.toString()}`)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Meta token exchange failed (${res.status}): ${text}`)
    }

    const json = await res.json()
    if (json.error) {
      throw new Error(`Meta OAuth error: ${json.error.message} (code: ${json.error.code})`)
    }

    const shortLivedToken = json.access_token

    // Step 2: Exchange for long-lived token (60 days)
    const llParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken,
    })

    const llRes = await fetch(`${META_TOKEN_URL}?${llParams.toString()}`)
    const llJson = await llRes.json()

    if (llJson.error) {
      // Fall back to short-lived if exchange fails
      console.warn('[Instagram] Long-lived token exchange failed, using short-lived token')
      return {
        accessToken: shortLivedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        scopes: REQUIRED_SCOPES,
      }
    }

    return {
      accessToken: llJson.access_token,
      // Long-lived tokens expire in 60 days
      expiresAt: llJson.expires_in
        ? new Date(Date.now() + llJson.expires_in * 1000)
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      scopes: REQUIRED_SCOPES,
    }
  }

  async refreshToken(oldToken: string): Promise<TokenSet> {
    // Meta long-lived tokens can be refreshed by re-exchanging
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: oldToken,
    })

    const res = await fetch(`${META_TOKEN_URL}?${params.toString()}`)
    const json = await res.json()

    if (json.error) {
      throw new Error(`Meta token refresh failed: ${json.error.message}`)
    }

    return {
      accessToken: json.access_token,
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      const meRes = await fetch(`${META_GRAPH_BASE}/me?access_token=${accessToken}`)
      const me = await meRes.json()
      if (me.id) {
        await fetch(`${META_GRAPH_BASE}/${me.id}/permissions`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      }
    } catch {
      console.warn('[Instagram] Token revocation failed (non-fatal)')
    }
  }

  // ============================================================================
  // Account Info
  // Gets the Instagram Business Account linked to the user's Facebook account
  // ============================================================================

  async getAccount(accessToken: string, externalAccountId?: string): Promise<AccountInfo> {
    let igAccountId = externalAccountId

    if (!igAccountId) {
      // Discover Instagram Business Account via Facebook Pages
      const pagesRes = await fetch(
        `${META_GRAPH_BASE}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
      )

      if (!pagesRes.ok) {
        const text = await pagesRes.text()
        throw new Error(`Meta Pages discovery failed (${pagesRes.status}): ${text}`)
      }

      const pagesJson = await pagesRes.json()
      const igPage = (pagesJson.data as Array<{ instagram_business_account?: { id: string } }>)
        ?.find(p => p.instagram_business_account?.id)

      if (!igPage?.instagram_business_account?.id) {
        throw new Error(
          'No Instagram Business account found. The connected Facebook account must manage a Page ' +
          'linked to an Instagram Professional account.'
        )
      }

      igAccountId = igPage.instagram_business_account.id
    }

    const fields = 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,website'
    const igRes = await fetch(
      `${META_GRAPH_BASE}/${igAccountId}?fields=${fields}&access_token=${accessToken}`
    )

    if (igRes.status === 401) throw new Error('TOKEN_EXPIRED')
    if (igRes.status === 403) throw new Error('PERMISSION_DENIED')
    if (igRes.status === 429) throw new Error('RATE_LIMITED')

    if (!igRes.ok) {
      const text = await igRes.text()
      throw new Error(`Instagram account fetch failed (${igRes.status}): ${text}`)
    }

    const ig = await igRes.json()
    if (ig.error) {
      throw new Error(`Instagram API error: ${ig.error.message} (code: ${ig.error.code})`)
    }

    return {
      externalId: ig.id,
      username: ig.username ?? '',
      accountName: ig.name ?? ig.username ?? 'Instagram Account',
      profileUrl: ig.username ? `https://www.instagram.com/${ig.username}/` : undefined,
      avatarUrl: ig.profile_picture_url,
      followersCount: ig.followers_count,
    }
  }

  // ============================================================================
  // Profile Metrics (requires instagram_manage_insights)
  // ============================================================================

  async getProfileMetrics(
    accessToken: string,
    externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<ProfileMetrics[]> {
    // Instagram Insights returns daily data
    const since = Math.floor(dateRange.from.getTime() / 1000)
    const until = Math.floor(dateRange.to.getTime() / 1000)

    const metrics = [
      'impressions',
      'reach',
      'profile_views',
      'follower_count',
    ].join(',')

    const res = await fetch(
      `${META_GRAPH_BASE}/${externalAccountId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${accessToken}`
    )

    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    if (res.status === 403) {
      // Insights require business account — gracefully degrade
      console.warn('[Instagram] Insights not available (requires Business account with instagram_manage_insights)')
      return []
    }
    if (res.status === 429) throw new Error('RATE_LIMITED')

    if (!res.ok) {
      console.warn(`[Instagram] Profile insights failed (${res.status}) — returning empty metrics`)
      return []
    }

    const json = await res.json()
    const insightsByDate: Record<string, ProfileMetrics> = {}

    for (const metric of (json.data ?? [])) {
      for (const point of (metric.values ?? [])) {
        const date = new Date(point.end_time)
        const dateKey = date.toISOString().split('T')[0]
        if (!insightsByDate[dateKey]) {
          insightsByDate[dateKey] = { date }
        }
        const m = insightsByDate[dateKey]
        switch (metric.name) {
          case 'impressions': m.impressions = point.value; break
          case 'reach': m.reach = point.value; break
          case 'profile_views': m.profileViews = point.value; break
          case 'follower_count': m.followers = point.value; break
        }
      }
    }

    return Object.values(insightsByDate)
  }

  async getPosts(
    accessToken: string,
    externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<PostData[]> {
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'thumbnail_url',
      'permalink',
      'timestamp',
      'like_count',
      'comments_count',
    ].join(',')

    // Get media list — paginate up to 50 posts
    const res = await fetch(
      `${META_GRAPH_BASE}/${externalAccountId}/media?fields=${fields}&limit=50&access_token=${accessToken}`
    )

    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Instagram media list failed (${res.status}): ${text}`)
    }

    const json = await res.json()
    const posts: PostData[] = []

    for (const m of (json.data ?? [])) {
      const publishedAt = new Date(m.timestamp)
      if (publishedAt < dateRange.from || publishedAt > dateRange.to) continue

      const likes = m.like_count ?? 0
      const comments = m.comments_count ?? 0

      posts.push({
        externalPostId: m.id,
        platform: 'instagram',
        postUrl: m.permalink,
        contentType: m.media_type?.toLowerCase() === 'video' ? 'video'
          : m.media_type?.toLowerCase() === 'carousel_album' ? 'carousel' : 'image',
        caption: m.caption,
        thumbnailUrl: m.thumbnail_url ?? m.media_url,
        publishedAt,
        likesCount: likes,
        commentsCount: comments,
        sharesCount: 0,   // Instagram does not expose share count via API
        viewsCount: 0,    // video_views requires separate insight call
        videoViewsCount: 0,
        reachCount: 0,    // per-post reach requires insight call — fetched in getPostMetrics
        impressionsCount: 0,
        engagementCount: likes + comments,
        engagementRate: undefined,
      })
    }

    return posts
  }

  async getPostMetrics(accessToken: string, externalPostId: string): Promise<PostMetrics> {
    const insightMetrics = 'impressions,reach,likes,comments,saved,video_views'
    const res = await fetch(
      `${META_GRAPH_BASE}/${externalPostId}/insights?metric=${insightMetrics}&access_token=${accessToken}`
    )

    if (!res.ok) {
      // Gracefully degrade — return zeros
      return {
        externalPostId,
        likesCount: 0, commentsCount: 0, sharesCount: 0,
        viewsCount: 0, videoViewsCount: 0, reachCount: 0, impressionsCount: 0,
        engagementCount: 0,
      }
    }

    const json = await res.json()
    const get = (name: string): number => {
      const item = (json.data ?? []).find((d: { name: string; values?: Array<{ value: number }> }) => d.name === name)
      return item?.values?.[0]?.value ?? 0
    }

    const likes = get('likes')
    const comments = get('comments')
    const impressions = get('impressions')
    const reach = get('reach')
    const videoViews = get('video_views')

    return {
      externalPostId,
      likesCount: likes,
      commentsCount: comments,
      sharesCount: 0,  // not available
      viewsCount: videoViews,
      videoViewsCount: videoViews,
      reachCount: reach,
      impressionsCount: impressions,
      engagementCount: likes + comments,
      engagementRate: impressions > 0
        ? Math.round(((likes + comments) / impressions) * 10000) / 100
        : undefined,
    }
  }

  async getComments(accessToken: string, externalPostId: string): Promise<CommentData[]> {
    const res = await fetch(
      `${META_GRAPH_BASE}/${externalPostId}/comments?fields=id,text,username,timestamp,like_count&access_token=${accessToken}`
    )

    if (!res.ok) return []

    const json = await res.json()
    return (json.data ?? []).map((c: Record<string, unknown>) => ({
      externalCommentId: c.id as string,
      externalPostId,
      authorName: (c.username as string) ?? 'Unknown',
      content: (c.text as string) ?? '',
      reactionCount: (c.like_count as number) ?? 0,
      publishedAt: new Date(c.timestamp as string),
    }))
  }

  async getFollowerHistory(
    _accessToken: string,
    _externalAccountId: string,
    _dateRange: SyncDateRange
  ): Promise<FollowerHistoryPoint[]> {
    // Historical follower counts are in getProfileMetrics (follower_count insight)
    return []
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: 'instagram',
      followers: true,
      follower_growth: true,
      likes: true,
      comments: true,
      shares: false,       // Instagram API does not expose share counts
      views: true,
      reach: true,         // requires instagram_manage_insights
      impressions: true,   // requires instagram_manage_insights
      engagements: true,
      engagement_rate: true,
      profile_views: true,
      video_views: true,
      mentions: 'tier',
      post_metrics: true,
      webhooks: true,
    }
  }
}
