/**
 * OAuth Initiation Route
 * GET /api/social/oauth/initiate?platform=tiktok&userId=xxx
 *
 * Server-side ONLY.
 * Creates a CSRF state in social_oauth_states, then returns the platform
 * OAuth authorization URL. The browser redirects to this URL.
 * Access/refresh tokens are NEVER sent to the client from this route.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProvider, isOAuthSupported } from '@/lib/services/social/platform-registry'
import type { SocialPlatform } from '@/types/marketing'

function buildRedirectUri(platform: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${appUrl}/api/social/oauth/callback/${platform}`
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const userId = searchParams.get('userId')

  if (!platform || !userId) {
    return NextResponse.json({ error: 'Missing required parameters: platform, userId' }, { status: 400 })
  }

  if (!isOAuthSupported(platform)) {
    return NextResponse.json({
      error: `Platform "${platform}" does not support OAuth connection. ` +
             `Supported: tiktok, instagram, facebook, linkedin`
    }, { status: 400 })
  }

  if (!process.env.ENCRYPTION_KEY) {
    return NextResponse.json({
      error: 'Server configuration error: ENCRYPTION_KEY is not set. ' +
             'Generate with: openssl rand -hex 32 and add to .env.local'
    }, { status: 503 })
  }

  try {
    const supabase = await createClient()

    // Generate CSRF state — cryptographically random 32 bytes
    const crypto = await import('crypto')
    const state = crypto.randomBytes(32).toString('hex')

    // Store state in DB for validation on callback
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    const { error: stateErr } = await supabase.from('social_oauth_states').insert({
      state,
      platform,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
    })

    if (stateErr) {
      console.error('[OAuth/Initiate] State insert error:', stateErr)
      return NextResponse.json({ error: 'Failed to create OAuth session. Please try again.' }, { status: 500 })
    }

    const provider = getProvider(platform as SocialPlatform)
    const redirectUri = buildRedirectUri(platform)
    const authUrl = provider.getAuthUrl(state, redirectUri)

    return NextResponse.json({ authUrl, state })
  } catch (err) {
    const message = (err as Error).message
    console.error('[OAuth/Initiate] Error:', message)

    // Surface credential missing errors clearly
    if (message.includes('environment variable is not set')) {
      return NextResponse.json({
        error: `Platform credentials not configured: ${message}`,
        setup_required: true,
      }, { status: 503 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
