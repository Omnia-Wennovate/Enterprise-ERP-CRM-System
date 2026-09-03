/**
 * LinkedIn Platform Provider
 * Server-side ONLY — never import from client components.
 *
 * Uses LinkedIn Organization API for company pages.
 *
 * Required OAuth scopes:
 *   r_organization_social   — read organization posts, followers, statistics
 *   rw_organization_admin   — required for follower/insight data on the org page
 *
 * These scopes require your LinkedIn App to have the "Marketing Developer Platform"
 * product enabled. This typically requires a review/approval process.
 *
 * Metrics available:
 *   followers:    ✓ (organization follower statistics)
 *   impressions:  ✓ (organization post statistics)
 *   reactions:    ✓ (per-post likesSummary)
 *   comments:     ✓ (per-post commentsSummary)
 *   shares:       ✓ (per-post shareStatistics)
 *   reach:        ✗ (LinkedIn does not expose unique reach via standard API)
 *   page_views:   ✓ (organization page statistics — pageStatisticsByMonth)
 *   video_views:  ✗ (not available in standard org API)
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

const LI_OAUTH_BASE = 'https://www.linkedin.com/oauth/v2/authorization'
const LI_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LI_API_BASE = 'https://api.linkedin.com/v2'

const REQUIRED_SCOPES = ['r_organization_social', 'rw_organization_admin']

export class LinkedInProvider implements SocialProvider {
  readonly platform = 'linkedin' as const

  private get clientId() {
    const id = process.env.LINKEDIN_CLIENT_ID
    if (!id) throw new Error('LINKEDIN_CLIENT_ID environment variable is not set')
    return id
  }

  private get clientSecret() {
    const s = process.env.LINKEDIN_CLIENT_SECRET
    if (!s) throw new Error('LINKEDIN_CLIENT_SECRET environment variable is not set')
    return s
  }

  // ============================================================================
  // OAuth
  // ============================================================================

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: REQUIRED_SCOPES.join(' '),
      state,
    })
    return `${LI_OAUTH_BASE}?${params.toString()}`
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })

    const res = await fetch(LI_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const json = await res.json()
    if (json.error) {
      throw new Error(`LinkedIn token exchange error: ${json.error} — ${json.error_description}`)
    }

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      // LinkedIn tokens are valid for ~60 days; refresh tokens ~365 days
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      scopes: REQUIRED_SCOPES,
    }
  }

  async refreshToken(refreshTokenValue: string): Promise<TokenSet> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })

    const res = await fetch(LI_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const json = await res.json()
    if (json.error) throw new Error(`LinkedIn token refresh error: ${json.error}`)

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? refreshTokenValue,
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : undefined,
    }
  }

  async revokeToken(_accessToken: string): Promise<void> {
    // LinkedIn does not have a public token revoke endpoint in the standard API
    // Local disconnect still proceeds
    console.warn('[LinkedIn] Platform does not support programmatic token revocation')
  }

  // ============================================================================
  // Account Info (Organization)
  // ============================================================================

  async getAccount(accessToken: string, externalAccountId?: string): Promise<AccountInfo> {
    let orgId = externalAccountId

    if (!orgId) {
      // Get organizations administered by this user
      const adminRes = await fetch(
        `${LI_API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organization~(id,name,logoV2(original~:playableStreams),vanityName)))`,
        { headers: { Authorization: `Bearer ${accessToken}`, 'X-RestLi-Protocol-Version': '2.0.0' } }
      )

      if (adminRes.status === 401) throw new Error('TOKEN_EXPIRED')
      if (adminRes.status === 403) throw new Error('PERMISSION_DENIED: rw_organization_admin scope required')
      if (!adminRes.ok) {
        const text = await adminRes.text()
        throw new Error(`LinkedIn org discovery failed (${adminRes.status}): ${text}`)
      }

      const adminJson = await adminRes.json()
      const orgs: Array<{ organization: string; 'organization~': { id: number; name: { localized: Record<string, string> }; vanityName?: string } }>
        = adminJson.elements ?? []

      if (orgs.length === 0) {
        throw new Error(
          'No LinkedIn Organizations found. The connected account must be an administrator of a LinkedIn Company Page.'
        )
      }

      // Use first org (user can reconnect to select a different one)
      const org = orgs[0]['organization~']
      orgId = String(org.id)
    }

    // Get org details
    const orgRes = await fetch(
      `${LI_API_BASE}/organizations/${orgId}?projection=(id,name,vanityName,logoV2(original~:playableStreams))`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'X-RestLi-Protocol-Version': '2.0.0' } }
    )

    if (orgRes.status === 401) throw new Error('TOKEN_EXPIRED')
    if (!orgRes.ok) {
      const text = await orgRes.text()
      throw new Error(`LinkedIn org fetch failed (${orgRes.status}): ${text}`)
    }

    const org = await orgRes.json()

    // Get follower count
    let followersCount: number | undefined
    try {
      const followersRes = await fetch(
        `${LI_API_BASE}/organizationFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}`,
        { headers: { Authorization: `Bearer ${accessToken}`, 'X-RestLi-Protocol-Version': '2.0.0' } }
      )
      if (followersRes.ok) {
        const fj = await followersRes.json()
        followersCount = fj.elements?.[0]?.followerCountsByAssociationType?.find(
          (a: { associationType: string; followerCounts: { organicFollowerCount: number } }) =>
            a.associationType === 'MEMBER'
        )?.followerCounts?.organicFollowerCount
      }
    } catch {
      console.warn('[LinkedIn] Could not fetch follower count')
    }

    const name = Object.values(
      (org.name?.localized ?? {}) as Record<string, string>
    )[0] ?? 'LinkedIn Organization'

    const vanityName = org.vanityName
    const avatarUrl = org.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier

    return {
      externalId: String(org.id),
      username: vanityName ?? String(org.id),
      accountName: name,
      profileUrl: vanityName ? `https://www.linkedin.com/company/${vanityName}/` : undefined,
      avatarUrl,
      followersCount,
    }
  }

  // ============================================================================
  // Profile Metrics
  // ============================================================================

  async getProfileMetrics(
    accessToken: string,
    externalAccountId: string,
    _dateRange: SyncDateRange
  ): Promise<ProfileMetrics[]> {
    const orgUrn = `urn:li:organization:${externalAccountId}`

    // Follower statistics
    const fsRes = await fetch(
      `${LI_API_BASE}/organizationFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'X-RestLi-Protocol-Version': '2.0.0' } }
    )

    let followers: number | undefined
    if (fsRes.ok) {
      const fsJson = await fsRes.json()
      followers = fsJson.elements?.[0]?.followerCountsByAssociationType?.find(
        (a: { associationType: string; followerCounts: { organicFollowerCount: number } }) =>
          a.associationType === 'MEMBER'
      )?.followerCounts?.organicFollowerCount
    }

    // Page statistics (impressions)
    const psRes = await fetch(
      `${LI_API_BASE}/organizationPageStatistics?q=organization&organization=${encodeURIComponent(orgUrn)}`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'X-RestLi-Protocol-Version': '2.0.0' } }
    )

    let impressions: number | undefined
    let profileViews: number | undefined
    if (psRes.ok) {
      const psJson = await psRes.json()
      const totals = psJson.elements?.[0]?.totalPageStatistics
      impressions = totals?.views?.allPageViews?.pageViews
      profileViews = totals?.views?.allPageViews?.uniquePageViews
    }

    return [
      {
        date: new Date(),
        followers,
        impressions,
        profileViews,
        reach: undefined,       // not available in standard API
        engagements: undefined, // set from post aggregation
      },
    ]
  }

  async getPosts(
    accessToken: string,
    externalAccountId: string,
    dateRange: SyncDateRange
  ): Promise<PostData[]> {
    const orgUrn = `urn:li:organization:${externalAccountId}`

    const res = await fetch(
      `${LI_API_BASE}/ugcPosts?q=authors&authors=List(${encodeURIComponent(orgUrn)})&count=50`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'X-RestLi-Protocol-Version': '2.0.0' } }
    )

    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`LinkedIn posts fetch failed (${res.status}): ${text}`)
    }

    const json = await res.json()
    const posts: PostData[] = []

    for (const post of (json.elements ?? [])) {
      const publishedAt = new Date(post.created?.time ?? 0)
      if (publishedAt < dateRange.from || publishedAt > dateRange.to) continue

      const postId: string = post.id

      // Get social actions (likes, comments, shares) for each post
      let likes = 0, comments = 0, shares = 0, impressions = 0

      try {
        const statsRes = await fetch(
          `${LI_API_BASE}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}&ugcPosts=List(${encodeURIComponent(postId)})`,
          { headers: { Authorization: `Bearer ${accessToken}`, 'X-RestLi-Protocol-Version': '2.0.0' } }
        )
        if (statsRes.ok) {
          const statsJson = await statsRes.json()
          const stats = statsJson.elements?.[0]?.totalShareStatistics
          likes = stats?.likeCount ?? 0
          comments = stats?.commentCount ?? 0
          shares = stats?.shareCount ?? 0
          impressions = stats?.impressionCount ?? 0
        }
      } catch {
        // Non-fatal — post still stored without metrics
      }

      const specificContent = post.specificContent?.['com.linkedin.ugc.ShareContent']
      const caption = specificContent?.shareCommentary?.text
      const mediaAsset = specificContent?.media?.[0]

      posts.push({
        externalPostId: postId,
        platform: 'linkedin',
        postUrl: mediaAsset?.originalUrl,
        contentType: specificContent?.shareMediaCategory === 'VIDEO' ? 'video' : 'image',
        caption,
        thumbnailUrl: mediaAsset?.thumbnails?.[0]?.url,
        publishedAt,
        likesCount: likes,
        commentsCount: comments,
        sharesCount: shares,
        viewsCount: 0,       // not available
        videoViewsCount: 0,  // not available
        reachCount: 0,       // not available
        impressionsCount: impressions,
        engagementCount: likes + comments + shares,
        engagementRate: impressions > 0
          ? Math.round(((likes + comments + shares) / impressions) * 10000) / 100
          : undefined,
      })
    }

    return posts
  }

  async getPostMetrics(accessToken: string, externalPostId: string): Promise<PostMetrics> {
    const res = await fetch(
      `${LI_API_BASE}/socialActions/${encodeURIComponent(externalPostId)}`,
      { headers: { Authorization: `Bearer ${accessToken}`, 'X-RestLi-Protocol-Version': '2.0.0' } }
    )

    if (!res.ok) {
      return {
        externalPostId, likesCount: 0, commentsCount: 0, sharesCount: 0,
        viewsCount: 0, videoViewsCount: 0, reachCount: 0, impressionsCount: 0, engagementCount: 0,
      }
    }

    const json = await res.json()
    const likes = json.likesSummary?.totalLikes ?? 0
    const comments = json.commentsSummary?.totalFirstLevelComments ?? 0

    return {
      externalPostId,
      likesCount: likes,
      commentsCount: comments,
      sharesCount: 0,
      viewsCount: 0,
      videoViewsCount: 0,
      reachCount: 0,
      impressionsCount: 0,
      engagementCount: likes + comments,
    }
  }

  async getComments(_accessToken: string, _externalPostId: string): Promise<CommentData[]> {
    // LinkedIn comments API is complex and rate-limited
    // Returning empty — comments count is included in post stats
    return []
  }

  async getFollowerHistory(
    _accessToken: string,
    _externalAccountId: string,
    _dateRange: SyncDateRange
  ): Promise<FollowerHistoryPoint[]> {
    return []
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: 'linkedin',
      followers: true,
      follower_growth: true,
      likes: true,
      comments: true,
      shares: true,
      views: false,
      reach: false,       // not available in standard API
      impressions: true,
      engagements: true,
      engagement_rate: true,
      profile_views: true,
      video_views: false,
      mentions: false,
      post_metrics: true,
      webhooks: false,
    }
  }
}
