/**
 * Facebook Platform Provider
 * Server-side ONLY — never import from client components.
 *
 * Uses Meta Graph API for Facebook Pages.
 *
 * Required permissions:
 *   pages_show_list          — enumerate pages the user manages
 *   pages_read_engagement    — read page followers, posts, reactions
 *   pages_read_user_content  — read posts and comments on the page
 *   read_insights            — access Page Insights (reach, impressions, etc.)
 *
 * OAuth flow uses Facebook Login (same Meta App as Instagram).
 * Page access tokens are derived from the user token + /accounts endpoint.
 *
 * Metrics available:
 *   followers: ✓ (fan_count / followers_count on Page)
 *   reach:     ✓ (page_impressions_unique via Insights)
 *   impressions: ✓ (page_impressions via Insights)
 *   reactions:  ✓ (per-post reactions breakdown)
 *   comments:   ✓
 *   shares:     ✓
 *   page_views: ✓ (page_views_total via Insights)
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
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'read_insights',
]

export class FacebookProvider implements SocialProvider {
  readonly platform = 'facebook' as const

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
    // Short-lived user token
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri,
      code,
    })

    const res = await fetch(`${META_TOKEN_URL}?${params.toString()}`)
    const json = await res.json()

    if (json.error) {
      throw new Error(`Meta OAuth error: ${json.error.message}`)
    }

    const userToken = json.access_token

    // Exchange for long-lived user token
    const llParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: userToken,
    })
    const llRes = await fetch(`${META_TOKEN_URL}?${llParams.toString()}`)
    const llJson = await llRes.json()

    const longLivedUserToken = llJson.access_token ?? userToken

    return {
      accessToken: longLivedUserToken,
      // Long-lived user token expires in ~60 days; Page tokens derived from it are non-expiring
      expiresAt: llJson.expires_in
        ? new Date(Date.now() + llJson.expires_in * 1000)
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      scopes: REQUIRED_SCOPES,
    }
  }

  async refreshToken(oldToken: string): Promise<TokenSet> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: oldToken,
    })
    const res = await fetch(`${META_TOKEN_URL}?${params.toString()}`)
    const json = await res.json()

    if (json.error) throw new Error(`Meta token refresh failed: ${json.error.message}`)

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
        await fetch(`${META_GRAPH_BASE}/${me.id}/permissions?access_token=${accessToken}`, {
          method: 'DELETE',
        })
      }
    } catch {
      console.warn('[Facebook] Token revocation failed (non-fatal)')
    }
  }

  // ============================================================================
  // Account Info — discovers the Facebook Page and returns a Page access token
  // The stored access token is the LONG-LIVED USER token.
  // Page access tokens are derived at sync time and NOT stored.
  // ============================================================================

  async getAccount(accessToken: string, externalAccountId?: string): Promise<AccountInfo> {
    // Get all pages managed by this user
    const pagesRes = await fetch(
      `${META_GRAPH_BASE}/me/accounts?fields=id,name,access_token,fan_count,followers_count,picture&access_token=${accessToken}`
    )

    if (pagesRes.status === 401) throw new Error('TOKEN_EXPIRED')
    if (pagesRes.status === 403) throw new Error('PERMISSION_DENIED')
    if (!pagesRes.ok) {
      const text = await pagesRes.text()
      throw new Error(`Facebook pages fetch failed (${pagesRes.status}): ${text}`)
    }

    const pagesJson = await pagesRes.json()
    const pages: Array<{ id: string; name: string; access_token: string; fan_count?: number; followers_count?: number; picture?: { data?: { url?: string } } }>
      = pagesJson.data ?? []

    if (pages.length === 0) {
      throw new Error('No Facebook Pages found. The connected account must manage at least one Facebook Page.')
    }

    // If we already have the page ID, use it; otherwise use first page
    const page = externalAccountId
      ? pages.find(p => p.id === externalAccountId) ?? pages[0]
      : pages[0]

    return {
      externalId: page.id,
      username: page.name,
      accountName: page.name,
      profileUrl: `https://www.facebook.com/${page.id}`,
      avatarUrl: page.picture?.data?.url,
      followersCount: page.followers_count ?? page.fan_count ?? 0,
    }
  }

  // Helper: get page access token from stored user token
  private async getPageAccessToken(userToken: string, pageId: string): Promise<string> {
    const res = await fetch(
      `${META_GRAPH_BASE}/${pageId}?fields=access_token&access_token=${userToken}`
    )
    const json = await res.json()
    if (json.error) throw new Error(`Cannot get page token: ${json.error.message}`)
    return json.access_token ?? userToken
  }

  // ============================================================================
  // Profile Metrics (Page Insights)
  // ============================================================================

  async getProfileMetrics(
    accessToken: string,
    externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<ProfileMetrics[]> {
    const pageToken = await this.getPageAccessToken(accessToken, externalAccountId)

    const since = Math.floor(dateRange.from.getTime() / 1000)
    const until = Math.floor(dateRange.to.getTime() / 1000)

    const metrics = [
      'page_impressions',
      'page_impressions_unique',
      'page_post_engagements',
      'page_views_total',
      'page_fan_adds_unique',
    ].join(',')

    const res = await fetch(
      `${META_GRAPH_BASE}/${externalAccountId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${pageToken}`
    )

    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    if (!res.ok) {
      console.warn(`[Facebook] Page insights failed (${res.status}) — returning empty metrics`)
      return []
    }

    const json = await res.json()
    const byDate: Record<string, ProfileMetrics> = {}

    for (const metric of (json.data ?? [])) {
      for (const point of (metric.values ?? [])) {
        const date = new Date(point.end_time)
        const key = date.toISOString().split('T')[0]
        if (!byDate[key]) byDate[key] = { date }
        const m = byDate[key]
        switch (metric.name) {
          case 'page_impressions': m.impressions = point.value; break
          case 'page_impressions_unique': m.reach = point.value; break
          case 'page_post_engagements': m.engagements = point.value; break
          case 'page_views_total': m.profileViews = point.value; break
        }
      }
    }

    // Also get current follower count
    const pageRes = await fetch(
      `${META_GRAPH_BASE}/${externalAccountId}?fields=followers_count,fan_count&access_token=${pageToken}`
    )
    if (pageRes.ok) {
      const pageJson = await pageRes.json()
      const today = new Date().toISOString().split('T')[0]
      if (!byDate[today]) byDate[today] = { date: new Date() }
      byDate[today].followers = pageJson.followers_count ?? pageJson.fan_count
    }

    return Object.values(byDate)
  }

  async getPosts(
    accessToken: string,
    externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<PostData[]> {
    const pageToken = await this.getPageAccessToken(accessToken, externalAccountId)
    const since = Math.floor(dateRange.from.getTime() / 1000)
    const until = Math.floor(dateRange.to.getTime() / 1000)

    const fields = 'id,message,story,created_time,permalink_url,full_picture,reactions.summary(true),comments.summary(true),shares'

    const res = await fetch(
      `${META_GRAPH_BASE}/${externalAccountId}/posts?fields=${fields}&since=${since}&until=${until}&limit=50&access_token=${pageToken}`
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Facebook posts fetch failed (${res.status}): ${text}`)
    }

    const json = await res.json()
    return (json.data ?? []).map((p: Record<string, unknown>) => {
      const reactions = ((p.reactions as Record<string, unknown>)?.summary as Record<string, unknown>)?.total_count as number ?? 0
      const comments = ((p.comments as Record<string, unknown>)?.summary as Record<string, unknown>)?.total_count as number ?? 0
      const shares = ((p.shares as Record<string, unknown>)?.count as number) ?? 0

      return {
        externalPostId: p.id as string,
        platform: 'facebook',
        postUrl: p.permalink_url as string | undefined,
        contentType: 'image',
        caption: (p.message as string) || (p.story as string) || undefined,
        thumbnailUrl: p.full_picture as string | undefined,
        publishedAt: new Date(p.created_time as string),
        likesCount: reactions,
        commentsCount: comments,
        sharesCount: shares,
        viewsCount: 0,
        videoViewsCount: 0,
        reachCount: 0,
        impressionsCount: 0,
        engagementCount: reactions + comments + shares,
      } satisfies PostData
    })
  }

  async getPostMetrics(accessToken: string, externalPostId: string): Promise<PostMetrics> {
    const insightMetrics = 'post_impressions,post_impressions_unique,post_engaged_users,post_clicks'
    const res = await fetch(
      `${META_GRAPH_BASE}/${externalPostId}/insights?metric=${insightMetrics}&access_token=${accessToken}`
    )

    if (!res.ok) {
      return {
        externalPostId, likesCount: 0, commentsCount: 0, sharesCount: 0,
        viewsCount: 0, videoViewsCount: 0, reachCount: 0, impressionsCount: 0, engagementCount: 0,
      }
    }

    const json = await res.json()
    const get = (name: string): number =>
      (json.data ?? []).find((d: { name: string; values?: Array<{ value: number }> }) => d.name === name)?.values?.[0]?.value ?? 0

    const impressions = get('post_impressions')
    const reach = get('post_impressions_unique')
    const engagements = get('post_engaged_users')

    return {
      externalPostId,
      likesCount: 0, // get from post-level reactions separately if needed
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      videoViewsCount: 0,
      reachCount: reach,
      impressionsCount: impressions,
      engagementCount: engagements,
      engagementRate: impressions > 0
        ? Math.round((engagements / impressions) * 10000) / 100
        : undefined,
    }
  }

  async getComments(accessToken: string, externalPostId: string): Promise<CommentData[]> {
    const res = await fetch(
      `${META_GRAPH_BASE}/${externalPostId}/comments?fields=id,message,from,created_time,like_count&access_token=${accessToken}`
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []).map((c: Record<string, unknown>) => ({
      externalCommentId: c.id as string,
      externalPostId,
      authorName: ((c.from as Record<string, string>)?.name) ?? 'Unknown',
      content: (c.message as string) ?? '',
      reactionCount: (c.like_count as number) ?? 0,
      publishedAt: new Date(c.created_time as string),
    }))
  }

  async getFollowerHistory(
    _accessToken: string,
    _externalAccountId: string,
    _dateRange: SyncDateRange
  ): Promise<FollowerHistoryPoint[]> {
    return [] // Historical snapshots built from getProfileMetrics over time
  }

  getCapabilities(): PlatformCapabilities {
    return {
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
    }
  }
}
