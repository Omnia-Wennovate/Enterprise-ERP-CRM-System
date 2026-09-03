/**
 * Social Accounts Service
 * Client-safe functions for reading/managing social accounts.
 * OAuth initiation, sync, and disconnect call server-side API routes.
 * Tokens are NEVER handled client-side.
 */

import { createClient } from '@/lib/supabase/client'
import type { SocialAccount } from '@/types/marketing'

// ============================================================================
// READ
// ============================================================================

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .order('platform', { ascending: true })

  if (error) throw error
  return (data ?? []) as SocialAccount[]
}

export async function getSocialAccountById(id: string): Promise<SocialAccount> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SocialAccount
}

export async function getAccountsByPlatform(platform: string): Promise<SocialAccount[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('platform', platform)
    .order('account_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as SocialAccount[]
}

// ============================================================================
// LATEST METRICS (from social_account_metrics — real synced data)
// ============================================================================

export interface LatestAccountMetrics {
  accountId: string
  platform: string
  metricDate: string
  followers: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  views: number | null
  reach: number | null
  impressions: number | null
  engagements: number | null
  engagementRate: number | null
  profileViews: number | null
  videoViews: number | null
  // Calculated
  followerDelta: number | null   // vs previous day
  followerDeltaPct: number | null
}

export async function getLatestMetricsForAccount(accountId: string): Promise<LatestAccountMetrics | null> {
  const supabase = createClient()

  // Get the two most recent metric rows to calculate delta
  const { data, error } = await supabase
    .from('social_account_metrics')
    .select('*')
    .eq('social_account_id', accountId)
    .order('metric_date', { ascending: false })
    .limit(2)

  if (error || !data || data.length === 0) return null

  const current = data[0]
  const previous = data[1] ?? null

  const followerDelta =
    current.followers !== null && previous?.followers !== null && previous !== null
      ? current.followers - previous.followers
      : null

  const followerDeltaPct =
    followerDelta !== null && previous?.followers && previous.followers > 0
      ? Math.round((followerDelta / previous.followers) * 10000) / 100
      : null

  return {
    accountId,
    platform: current.platform,
    metricDate: current.metric_date,
    followers: current.followers,
    likes: current.likes,
    comments: current.comments,
    shares: current.shares,
    views: current.views,
    reach: current.reach,
    impressions: current.impressions,
    engagements: current.engagements,
    engagementRate: current.engagement_rate,
    profileViews: current.profile_views,
    videoViews: current.video_views,
    followerDelta,
    followerDeltaPct,
  }
}

export async function getAllLatestMetrics(): Promise<Record<string, LatestAccountMetrics>> {
  const supabase = createClient()

  // Get accounts
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('id')

  if (!accounts || accounts.length === 0) return {}

  const result: Record<string, LatestAccountMetrics> = {}
  await Promise.all(
    accounts.map(async (a) => {
      const m = await getLatestMetricsForAccount(a.id)
      if (m) result[a.id] = m
    })
  )
  return result
}

// ============================================================================
// TOTAL FOLLOWERS (from real metrics — oauth_connected accounts only)
// ============================================================================

export async function getTotalFollowers(): Promise<number> {
  const supabase = createClient()

  // Only count accounts with real OAuth connection
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('id, followers_count, connection_status')

  if (!accounts) return 0

  const oauthAccounts = accounts.filter(a => a.connection_status === 'oauth_connected')
  if (oauthAccounts.length === 0) return 0

  // Use latest metrics if available, fall back to followers_count column
  let total = 0
  for (const a of oauthAccounts) {
    const metrics = await getLatestMetricsForAccount(a.id)
    total += metrics?.followers ?? a.followers_count ?? 0
  }
  return total
}

// ============================================================================
// OAUTH INITIATION (client-facing — calls server route)
// ============================================================================

export async function initiateOAuth(
  platform: string,
  userId: string
): Promise<{ authUrl: string } | { error: string; setup_required?: boolean }> {
  const res = await fetch(
    `/api/social/oauth/initiate?platform=${encodeURIComponent(platform)}&userId=${encodeURIComponent(userId)}`
  )
  const json = await res.json()

  if (!res.ok || json.error) {
    return { error: json.error ?? 'Failed to initiate OAuth', setup_required: json.setup_required }
  }

  return { authUrl: json.authUrl }
}

// ============================================================================
// SYNC (client-facing — calls server route)
// ============================================================================

export interface SyncResponse {
  success: boolean
  error?: string
  action?: 'reconnect' | 'retry_later' | 'retry'
  syncStatus?: string
  lastSyncedAt?: string
  followersNow?: number
  followerDelta?: number | null
  metricsUpserted?: number
  postsUpserted?: number
  account?: SocialAccount
  latestMetrics?: LatestAccountMetrics | null
}

export async function syncSocialAccount(accountId: string): Promise<SyncResponse> {
  const res = await fetch('/api/social/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  })

  const json = await res.json()

  if (!res.ok) {
    return { success: false, error: json.error ?? 'Sync failed' }
  }

  return json as SyncResponse
}

// ============================================================================
// DISCONNECT (client-facing — calls server route)
// ============================================================================

export async function disconnectSocialAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/social/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  })
  const json = await res.json()
  return json
}

// ============================================================================
// CREATE (manual/unsupported platforms only)
// ============================================================================

export async function createManualAccount(account: {
  platform: string
  account_name: string
  profile_url?: string
}): Promise<SocialAccount> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .insert({
      ...account,
      connection_status: 'manual',
      status: 'disconnected',
      api_status: 'error',
      followers_count: 0,  // never manually set — comes from API
    })
    .select()
    .single()

  if (error) throw error
  return data as SocialAccount
}

// ============================================================================
// UPDATE (name/url edits only — never tokens)
// ============================================================================

export async function updateAccountInfo(
  id: string,
  updates: Pick<Partial<SocialAccount>, 'account_name' | 'profile_url'>
): Promise<SocialAccount> {
  const supabase = createClient()

  // Explicitly whitelist what can be updated client-side
  // Tokens, connection_status, external_account_id are server-only
  const safeUpdates = {
    ...(updates.account_name !== undefined ? { account_name: updates.account_name } : {}),
    ...(updates.profile_url !== undefined ? { profile_url: updates.profile_url } : {}),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('social_accounts')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SocialAccount
}

// ============================================================================
// DELETE (with audit consideration)
// ============================================================================

export async function deleteSocialAccount(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// DEPRECATED — kept for backwards compatibility, redirects to new functions
// ============================================================================

/** @deprecated Use syncSocialAccount() instead */
export async function syncAccountStatus(id: string): Promise<SocialAccount> {
  const result = await syncSocialAccount(id)
  if (result.account) return result.account
  // Fall back to fetching current state
  return getSocialAccountById(id)
}

/** @deprecated Use createManualAccount() instead */
export async function createSocialAccount(account: Partial<SocialAccount>): Promise<SocialAccount> {
  return createManualAccount({
    platform: account.platform ?? 'facebook',
    account_name: account.account_name ?? '',
    profile_url: account.profile_url ?? undefined,
  })
}

/** @deprecated Use updateAccountInfo() instead */
export async function updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount> {
  return updateAccountInfo(id, updates)
}
