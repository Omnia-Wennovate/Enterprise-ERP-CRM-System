/**
 * Social Sync Route
 * POST /api/social/sync
 * Body: { accountId: string }
 *
 * Server-side ONLY. Called by the Sync button in the UI.
 * Performs a real API synchronization for the given account.
 * Returns updated account data and latest metrics.
 * Never returns access/refresh tokens.
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncAccount } from '@/lib/services/social/sync-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  let accountId: string

  try {
    const body = await request.json()
    accountId = body?.accountId
  } catch {
    return NextResponse.json({ error: 'Invalid request body. Expected { accountId: string }' }, { status: 400 })
  }

  if (!accountId || typeof accountId !== 'string') {
    return NextResponse.json({ error: 'Missing required field: accountId' }, { status: 400 })
  }

  if (!process.env.ENCRYPTION_KEY) {
    return NextResponse.json({
      error: 'Server configuration error: ENCRYPTION_KEY is not set.',
      setup_required: true,
    }, { status: 503 })
  }

  try {
    const result = await syncAccount(accountId, 'manual')

    if (!result.success) {
      // Return 200 with error details so the UI can display the specific error
      return NextResponse.json({
        success: false,
        error: result.error,
        syncStatus: result.syncStatus,
        lastSyncedAt: result.lastSyncedAt,
        // Hint to UI what action to take
        action: result.error?.includes('TOKEN_EXPIRED') || result.error?.includes('PERMISSION_DENIED')
          ? 'reconnect'
          : result.error?.includes('RATE_LIMITED')
          ? 'retry_later'
          : 'retry',
      })
    }

    // Fetch updated account data to return to UI (no tokens)
    const supabase = await createClient()
    const { data: account } = await supabase
      .from('social_accounts')
      .select('id, platform, account_name, username, avatar_url, profile_url, followers_count, status, connection_status, api_status, last_sync_at, last_sync_status, last_sync_error')
      .eq('id', accountId)
      .single()

    // Fetch latest metrics
    const { data: latestMetrics } = await supabase
      .from('social_account_metrics')
      .select('*')
      .eq('social_account_id', accountId)
      .order('metric_date', { ascending: false })
      .limit(2)

    const current = latestMetrics?.[0] ?? null
    const previous = latestMetrics?.[1] ?? null

    const followerDelta = current && previous && current.followers !== null && previous.followers !== null
      ? current.followers - previous.followers
      : null

    return NextResponse.json({
      success: true,
      syncStatus: result.syncStatus,
      lastSyncedAt: result.lastSyncedAt,
      followersNow: result.followersNow,
      followerDelta,
      metricsUpserted: result.metricsUpserted,
      postsUpserted: result.postsUpserted,
      account,
      latestMetrics: current,
    })
  } catch (err) {
    console.error('[Sync Route] Unexpected error:', (err as Error).message)
    return NextResponse.json({ error: 'Internal server error during sync' }, { status: 500 })
  }
}
