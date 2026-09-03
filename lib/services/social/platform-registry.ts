/**
 * Platform Registry
 * Maps SocialPlatform → SocialProvider instance.
 * Server-side ONLY — never import from client components.
 */

import type { SocialProvider } from './social-provider'
import type { SocialPlatform } from '@/types/marketing'
import { TikTokProvider } from './platforms/tiktok-provider'
import { InstagramProvider } from './platforms/instagram-provider'
import { FacebookProvider } from './platforms/facebook-provider'
import { LinkedInProvider } from './platforms/linkedin-provider'

// Lazily instantiated singletons per provider
const registry = new Map<SocialPlatform, SocialProvider>()

function getProvider(platform: SocialPlatform): SocialProvider {
  if (!registry.has(platform)) {
    switch (platform) {
      case 'tiktok':
        registry.set(platform, new TikTokProvider())
        break
      case 'instagram':
        registry.set(platform, new InstagramProvider())
        break
      case 'facebook':
        registry.set(platform, new FacebookProvider())
        break
      case 'linkedin':
        registry.set(platform, new LinkedInProvider())
        break
      default:
        throw new Error(
          `Platform "${platform}" does not have an OAuth provider implemented. ` +
          `Supported platforms: tiktok, instagram, facebook, linkedin.`
        )
    }
  }
  return registry.get(platform)!
}

export { getProvider }

/** Check if a platform has a real OAuth provider (vs manual-entry only) */
export function isOAuthSupported(platform: string): boolean {
  return ['tiktok', 'instagram', 'facebook', 'linkedin'].includes(platform)
}

/** List all platforms that support OAuth connection */
export const OAUTH_SUPPORTED_PLATFORMS: SocialPlatform[] = [
  'tiktok',
  'instagram',
  'facebook',
  'linkedin',
]
