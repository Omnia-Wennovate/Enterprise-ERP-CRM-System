/**
 * Social Sync Service
 * Server-side ONLY — never import from client components.
 *
 * Core sync engine. Orchestrates:
 * 1. Token retrieval + decryption
 * 2. Token expiry check + refresh
 * 3. Account info update
 * 4. Profile metrics upsert → social_account_metrics
 * 5. Posts upsert → social_posts
 * 6. Sync job logging → sync_job_log
 * 7. Status update → social_accounts
 */

import { createClient } from '@/lib/supabase/server'
import { getProvider } from './platform-registry'
import {
  getDecryptedTokens,
  storeEncryptedTokens,
  isTokenExpired,
  clearEncryptedTokens,
} from './social-token-service'
import type { SocialPlatform, SyncStatus } from '@/types/marketing'
import type { PostData, ProfileMetrics } from './social-provider'

// ============================================================================
// TYPES
// ============================================================================

export type SyncTrigger = 'manual' | 'scheduled' | 'oauth_callback'

export interface SyncResult {
  success: boolean
  accountId: string
  platform: SocialPlatform
  syncStatus: SyncStatus
  error?: string
  metricsUpserted?: number
  postsUpserted?: number
  followersNow?: number
  lastSyncedAt: string
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

export async function syncAccount(
  accountId: string,
  trigger: SyncTrigger = 'manual'
): Promise<SyncResult> {
  const supabase = await createClient()
  const startedAt = new Date().toISOString()

  // ---- Load account record ----
  const { data: account, error: accountErr } = await supabase
    .from('social_accounts')
    .select('id, platform, external_account_id, connection_status, last_sync_status')
    .eq('id', accountId)
    .single()

  if (accountErr || !account) {
    return {
      success: false,
      accountId,
      platform: 'tiktok', // fallback type
      syncStatus: 'failed',
      error: `Account not found: ${accountErr?.message}`,
      lastSyncedAt: startedAt,
    }
  }

  const platform = account.platform as SocialPlatform

  // ---- Verify OAuth connection ----
  if (account.connection_status !== 'oauth_connected') {
    const errMsg = `Account is not OAuth-connected (status: ${account.connection_status}). Connect the account first.`
    await markSyncFailed(supabase, accountId, errMsg, startedAt, trigger)
    return {
      success: false, accountId, platform,
      syncStatus: 'failed', error: errMsg, lastSyncedAt: startedAt,
    }
  }

  // ---- Mark as syncing ----
  await supabase.from('social_accounts').update({
    last_sync_status: 'syncing',
    updated_at: new Date().toISOString(),
  }).eq('id', accountId)

  // Create sync job log entry
  const { data: jobLog } = await supabase.from('sync_job_log').insert({
    social_account_id: accountId,
    job_type: 'full_sync',
    started_at: startedAt,
    status: 'running',
    triggered_by: trigger,
  }).select('id').single()

  const jobLogId = jobLog?.id

  try {
    const provider = getProvider(platform)

    // ---- Get tokens ----
    let tokens = await getDecryptedTokens(accountId)

    // ---- Refresh if expired ----
    if (isTokenExpired(tokens.expiresAt)) {
      if (!tokens.refreshToken) {
        throw new Error('TOKEN_EXPIRED: No refresh token available. Please reconnect the account.')
      }
      try {
        const refreshed = await provider.refreshToken(tokens.refreshToken)
        await storeEncryptedTokens(accountId, refreshed)
        tokens = {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
          expiresAt: refreshed.expiresAt,
        }
        // Log token refresh
        await supabase.from('social_audit_log').insert({
          action: 'token_refresh',
          social_account_id: accountId,
          platform,
          performed_by: 'system',
          performed_by_name: 'Sync Service',
          details: { trigger },
        })
      } catch (refreshErr) {
        const msg = `Token refresh failed: ${(refreshErr as Error).message}`
        await clearEncryptedTokens(accountId)
        await supabase.from('social_accounts').update({
          connection_status: 'expired',
          status: 'disconnected',
          api_status: 'expired',
          last_sync_status: 'failed',
          last_sync_error: msg,
          updated_at: new Date().toISOString(),
        }).eq('id', accountId)
        throw new Error(msg)
      }
    }

    // ---- Fetch account info ----
    const accountInfo = await provider.getAccount(
      tokens.accessToken,
      account.external_account_id ?? undefined
    )

    // ---- Update account info in DB ----
    await supabase.from('social_accounts').update({
      username: accountInfo.username,
      account_name: accountInfo.accountName,
      profile_url: accountInfo.profileUrl ?? null,
      avatar_url: accountInfo.avatarUrl ?? null,
      followers_count: accountInfo.followersCount ?? 0,
      external_account_id: accountInfo.externalId,
    }).eq('id', accountId)

    // ---- Fetch profile metrics (last 7 days) ----
    const dateRange = {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    }

    let metricsUpserted = 0
    let profileMetrics: ProfileMetrics[] = []

    try {
      profileMetrics = await provider.getProfileMetrics(
        tokens.accessToken,
        accountInfo.externalId,
        dateRange
      )
      metricsUpserted = await upsertMetrics(supabase, accountId, platform, profileMetrics, accountInfo.followersCount)
    } catch (metricsErr) {
      console.warn(`[Sync] Profile metrics failed for ${platform}/${accountId}: ${(metricsErr as Error).message}`)
      // Partial sync — continue with posts
    }

    // ---- Fetch posts ----
    let postsUpserted = 0
    try {
      const posts = await provider.getPosts(tokens.accessToken, accountInfo.externalId, dateRange)
      postsUpserted = await upsertPosts(supabase, accountId, platform, posts)
    } catch (postsErr) {
      console.warn(`[Sync] Posts sync failed for ${platform}/${accountId}: ${(postsErr as Error).message}`)
      // Non-fatal — metrics may still have synced
    }

    // ---- Finalize success ----
    const now = new Date().toISOString()
    await supabase.from('social_accounts').update({
      last_sync_at: now,
      last_sync_status: 'success',
      last_sync_error: null,
      status: 'connected',
      api_status: 'active',
      connection_status: 'oauth_connected',
      updated_at: now,
    }).eq('id', accountId)

    if (jobLogId) {
      await supabase.from('sync_job_log').update({
        completed_at: now,
        status: 'success',
        records_synced: metricsUpserted + postsUpserted,
      }).eq('id', jobLogId)
    }

    return {
      success: true,
      accountId,
      platform,
      syncStatus: 'success',
      metricsUpserted,
      postsUpserted,
      followersNow: accountInfo.followersCount,
      lastSyncedAt: now,
    }
  } catch (err) {
    const errMsg = (err as Error).message
    const isExpired = errMsg.includes('TOKEN_EXPIRED')
    const isPermission = errMsg.includes('PERMISSION_DENIED')
    const isRateLimit = errMsg.includes('RATE_LIMITED')

    const syncStatus: SyncStatus = 'failed'
    const connectionStatus = isExpired ? 'expired'
      : isRateLimit ? 'oauth_connected'  // still connected, just rate-limited
      : isPermission ? 'error'
      : 'error'

    await markSyncFailed(supabase, accountId, errMsg, startedAt, trigger)

    await supabase.from('social_accounts').update({
      connection_status: connectionStatus,
      status: isExpired ? 'disconnected' : 'connected',
      api_status: isExpired ? 'expired' : isRateLimit ? 'rate_limited' : 'error',
    }).eq('id', accountId)

    if (jobLogId) {
      await supabase.from('sync_job_log').update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: errMsg,
      }).eq('id', jobLogId)
    }

    return {
      success: false, accountId, platform,
      syncStatus, error: errMsg,
      lastSyncedAt: startedAt,
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function upsertMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  platform: string,
  metrics: ProfileMetrics[],
  currentFollowers?: number
): Promise<number> {
  if (metrics.length === 0) {
    // At minimum, upsert today's snapshot with current follower count
    if (currentFollowers !== undefined) {
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('social_account_metrics').upsert({
        social_account_id: accountId,
        platform,
        metric_date: today,
        followers: currentFollowers,
      }, { onConflict: 'social_account_id,metric_date' })
      return 1
    }
    return 0
  }

  const rows = metrics.map(m => ({
    social_account_id: accountId,
    platform,
    metric_date: m.date.toISOString().split('T')[0],
    followers: m.followers ?? null,
    likes: m.likes ?? null,
    comments: m.comments ?? null,
    shares: m.shares ?? null,
    views: m.views ?? null,
    reach: m.reach ?? null,
    impressions: m.impressions ?? null,
    engagements: m.engagements ?? null,
    engagement_rate: m.engagementRate ?? null,
    profile_views: m.profileViews ?? null,
    video_views: m.videoViews ?? null,
  }))

  const { error } = await supabase
    .from('social_account_metrics')
    .upsert(rows, { onConflict: 'social_account_id,metric_date' })

  if (error) throw new Error(`Metrics upsert failed: ${error.message}`)
  return rows.length
}

async function upsertPosts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  platform: string,
  posts: PostData[]
): Promise<number> {
  if (posts.length === 0) return 0

  const rows = posts.map(p => ({
    account_id: accountId,
    external_post_id: p.externalPostId,
    platform,
    post_url: p.postUrl ?? null,
    content_type: p.contentType,
    caption: p.caption ?? null,
    thumbnail_url: p.thumbnailUrl ?? null,
    published_at: p.publishedAt.toISOString(),
    status: 'published',
    likes_count: p.likesCount,
    comments_count: p.commentsCount,
    shares_count: p.sharesCount,
    views_count: p.viewsCount,
    video_views_count: p.videoViewsCount,
    reach_count: p.reachCount,
    impressions_count: p.impressionsCount,
    engagement_count: p.engagementCount,
    last_synced_at: new Date().toISOString(),
    // updated_at for conflict resolution
    updated_at: new Date().toISOString(),
  }))

  // Upsert by (account_id, external_post_id)
  const { error } = await supabase
    .from('social_posts')
    .upsert(rows, { onConflict: 'account_id,external_post_id', ignoreDuplicates: false })

  if (error) throw new Error(`Posts upsert failed: ${error.message}`)
  return rows.length
}

async function markSyncFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  errMsg: string,
  startedAt: string,
  trigger: SyncTrigger
): Promise<void> {
  const now = new Date().toISOString()
  await supabase.from('social_accounts').update({
    last_sync_at: now,
    last_sync_status: 'failed',
    last_sync_error: errMsg.substring(0, 500), // cap to column length
    api_status: errMsg.includes('TOKEN_EXPIRED') ? 'expired'
      : errMsg.includes('RATE_LIMITED') ? 'rate_limited' : 'error',
    updated_at: now,
  }).eq('id', accountId)
}

// ============================================================================
// INITIAL SYNC (called after OAuth callback)
// ============================================================================

export async function initialSync(accountId: string): Promise<SyncResult> {
  return syncAccount(accountId, 'oauth_callback')
}
