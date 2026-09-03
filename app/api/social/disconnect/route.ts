/**
 * Social Disconnect Route
 * POST /api/social/disconnect
 * Body: { accountId: string }
 *
 * Server-side ONLY.
 * Revokes the platform token (where supported), clears encrypted tokens
 * from the database, and marks the account as disconnected.
 * Preserves all historical metrics — nothing is deleted.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProvider, isOAuthSupported } from '@/lib/services/social/platform-registry'
import {
  getDecryptedTokens,
  clearEncryptedTokens,
} from '@/lib/services/social/social-token-service'
import type { SocialPlatform } from '@/types/marketing'

export async function POST(request: NextRequest): Promise<NextResponse> {
  let accountId: string

  try {
    const body = await request.json()
    accountId = body?.accountId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!accountId) {
    return NextResponse.json({ error: 'Missing required field: accountId' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Load account
    const { data: account, error: accountErr } = await supabase
      .from('social_accounts')
      .select('id, platform, connection_status')
      .eq('id', accountId)
      .single()

    if (accountErr || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Best-effort token revocation (non-fatal if it fails)
    if (
      account.connection_status === 'oauth_connected' &&
      isOAuthSupported(account.platform)
    ) {
      try {
        const tokens = await getDecryptedTokens(accountId)
        const provider = getProvider(account.platform as SocialPlatform)
        await provider.revokeToken(tokens.accessToken)
      } catch (revokeErr) {
        // Log but continue — local disconnect must still proceed
        console.warn(
          `[Disconnect] Token revocation failed for ${accountId} (non-fatal):`,
          (revokeErr as Error).message
        )
      }
    }

    // Clear encrypted tokens and mark disconnected
    await clearEncryptedTokens(accountId)

    // Additional status updates
    await supabase.from('social_accounts').update({
      status: 'disconnected',
      api_status: 'error',
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    }).eq('id', accountId)

    // Audit log
    await supabase.from('social_audit_log').insert({
      action: 'disconnect',
      social_account_id: accountId,
      platform: account.platform,
      performed_by: 'user', // In a full auth setup, use the session user ID
      performed_by_name: 'User',
      details: { kept_data: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Account disconnected. Historical metrics have been preserved.',
      accountId,
    })
  } catch (err) {
    console.error('[Disconnect] Unexpected error:', (err as Error).message)
    return NextResponse.json({ error: 'Internal server error during disconnect' }, { status: 500 })
  }
}
