/**
 * OAuth Callback Route
 * GET /api/social/oauth/callback/[platform]?code=xxx&state=yyy
 *
 * Server-side ONLY. Handles the OAuth callback from the platform.
 *
 * Flow:
 * 1. Validate CSRF state from social_oauth_states
 * 2. Exchange authorization code for tokens (server-side)
 * 3. Encrypt and store tokens in social_accounts
 * 4. Fetch real account info from platform API
 * 5. Find existing manual record OR create new account row
 * 6. Update account with real external_account_id + account info
 * 7. Trigger initial sync
 * 8. Audit log the connect event
 * 9. Redirect to /marketing/accounts?connected=true
 *
 * Access tokens NEVER appear in redirect URLs or response bodies.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProvider } from '@/lib/services/social/platform-registry'
import { storeEncryptedTokens } from '@/lib/services/social/social-token-service'
import { initialSync } from '@/lib/services/social/sync-service'
import type { SocialPlatform } from '@/types/marketing'

type RouteParams = { params: Promise<{ platform: string }> }

function buildRedirectUri(platform: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${appUrl}/api/social/oauth/callback/${platform}`
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { platform } = await params
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const accountsUrl = `${appUrl}/marketing/accounts`

  // ---- Platform denied the request ----
  if (errorParam) {
    const msg = encodeURIComponent(errorDescription ?? errorParam)
    return NextResponse.redirect(`${accountsUrl}?error=${msg}&platform=${platform}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${accountsUrl}?error=Missing+code+or+state+parameter&platform=${platform}`)
  }

  try {
    const supabase = await createClient()

    // ---- Validate CSRF state ----
    const { data: oauthState, error: stateErr } = await supabase
      .from('social_oauth_states')
      .select('*')
      .eq('state', state)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateErr || !oauthState) {
      return NextResponse.redirect(
        `${accountsUrl}?error=Invalid+or+expired+OAuth+session.+Please+try+connecting+again.&platform=${platform}`
      )
    }

    // ---- Mark state as used (one-time) ----
    await supabase.from('social_oauth_states').update({
      used_at: new Date().toISOString(),
    }).eq('id', oauthState.id)

    // ---- Exchange code for tokens ----
    const provider = getProvider(platform as SocialPlatform)
    const redirectUri = buildRedirectUri(platform)

    let tokens
    try {
      tokens = await provider.exchangeCode(code, redirectUri)
    } catch (exchangeErr) {
      const msg = encodeURIComponent(`Token exchange failed: ${(exchangeErr as Error).message}`)
      return NextResponse.redirect(`${accountsUrl}?error=${msg}&platform=${platform}`)
    }

    // ---- Fetch real account info ----
    let accountInfo
    try {
      accountInfo = await provider.getAccount(tokens.accessToken)
    } catch (accountErr) {
      const msg = encodeURIComponent(`Account fetch failed: ${(accountErr as Error).message}`)
      return NextResponse.redirect(`${accountsUrl}?error=${msg}&platform=${platform}`)
    }

    // ---- Find or create social_accounts record ----
    // Priority: existing manual record for this platform with no external_account_id,
    //           OR existing record with same external_account_id (reconnect),
    //           OR create new.

    let accountId: string

    // Check for exact match on external_account_id (reconnect case)
    const { data: existingByExternalId } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('platform', platform)
      .eq('external_account_id', accountInfo.externalId)
      .single()

    if (existingByExternalId) {
      accountId = existingByExternalId.id
    } else {
      // Check for manual record without external_account_id (first OAuth for this platform)
      const { data: existingManual } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('platform', platform)
        .is('external_account_id', null)
        .eq('connection_status', 'manual')
        .limit(1)
        .single()

      if (existingManual) {
        accountId = existingManual.id
      } else {
        // Create new account record
        const { data: newAccount, error: createErr } = await supabase
          .from('social_accounts')
          .insert({
            platform,
            account_name: accountInfo.accountName,
            username: accountInfo.username,
            profile_url: accountInfo.profileUrl ?? null,
            avatar_url: accountInfo.avatarUrl ?? null,
            followers_count: accountInfo.followersCount ?? 0,
            external_account_id: accountInfo.externalId,
            connection_status: 'oauth_connected',
            status: 'connected',
            api_status: 'active',
            created_by: oauthState.user_id,
          })
          .select('id')
          .single()

        if (createErr || !newAccount) {
          const msg = encodeURIComponent(`Failed to create account record: ${createErr?.message}`)
          return NextResponse.redirect(`${accountsUrl}?error=${msg}&platform=${platform}`)
        }

        accountId = newAccount.id
      }
    }

    // ---- Store encrypted tokens ----
    await storeEncryptedTokens(accountId, tokens)

    // ---- Update account with real info ----
    await supabase.from('social_accounts').update({
      account_name: accountInfo.accountName,
      username: accountInfo.username,
      profile_url: accountInfo.profileUrl ?? null,
      avatar_url: accountInfo.avatarUrl ?? null,
      followers_count: accountInfo.followersCount ?? 0,
      external_account_id: accountInfo.externalId,
      connection_status: 'oauth_connected',
      status: 'connected',
      api_status: 'active',
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    }).eq('id', accountId)

    // ---- Audit log ----
    await supabase.from('social_audit_log').insert({
      action: existingByExternalId ? 'reauthorize' : 'connect',
      social_account_id: accountId,
      platform,
      performed_by: oauthState.user_id,
      performed_by_name: 'User',
      details: {
        external_account_id: accountInfo.externalId,
        username: accountInfo.username,
        scopes: tokens.scopes,
      },
    })

    // ---- Initial sync (async — don't block redirect) ----
    // Fire and forget — the page will show "Syncing..." and user can refresh
    initialSync(accountId).catch(err => {
      console.error(`[OAuth/Callback] Initial sync failed for ${accountId}:`, err.message)
    })

    return NextResponse.redirect(
      `${accountsUrl}?connected=true&platform=${platform}&account=${encodeURIComponent(accountInfo.accountName)}`
    )
  } catch (err) {
    const message = (err as Error).message
    console.error('[OAuth/Callback] Unexpected error:', message)
    return NextResponse.redirect(
      `${accountsUrl}?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}&platform=${platform}`
    )
  }
}
