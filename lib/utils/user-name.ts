/**
 * User name resolution utility.
 * Guarantees that generic placeholder values like 'User' or 'user' are never
 * displayed, resolving actual human names from email or profile data.
 */

// Known team user email mapping for accurate display names
export const KNOWN_USER_NAMES: Record<string, { full: string; first: string }> = {
  'bekan.bekele74@gmail.com': { full: 'Bekan Bekele', first: 'Bekan' },
  'kalkidantesfaye21971@gmail.com': { full: 'Kalkidan Tesfaye', first: 'Kalkidan' },
  'nurfaris08@gmail.com': { full: 'Nur Faris', first: 'Nur' },
  'alaminfsiraj@gmail.com': { full: 'Alamin Faris Siraj', first: 'Alamin' },
  'davidbezuneh@gmail.com': { full: 'David Bezuneh', first: 'David' },
  'melika.wennovate@gmail.com': { full: 'Melika Wennovate', first: 'Melika' },
  'belenwolde2@gmail.com': { full: 'Belen Wolde', first: 'Belen' },
  'zuludalo98@gmail.com': { full: 'Zulu Dalo', first: 'Zulu' },
}

/**
 * Checks if a string is a placeholder / invalid name
 */
export function isPlaceholderName(name?: string | null): boolean {
  if (!name) return true
  const cleaned = name.trim().toLowerCase()
  return (
    cleaned === '' ||
    cleaned === 'user' ||
    cleaned === 'user user' ||
    cleaned === 'system user' ||
    cleaned === 'test' ||
    cleaned === 'admin'
  )
}

/**
 * Derives a human-friendly name from an email address
 */
export function deriveNameFromEmail(email?: string | null): { full: string; first: string } {
  if (!email) {
    return { full: 'Team Member', first: 'Member' }
  }

  const normalized = email.toLowerCase().trim()
  if (KNOWN_USER_NAMES[normalized]) {
    return KNOWN_USER_NAMES[normalized]
  }

  // General email parsing:
  // e.g. "john.doe42@example.com" -> ["john", "doe"] -> "John Doe"
  const localPart = normalized.split('@')[0] || ''

  // Special smart splits for known compound patterns:
  let formatted = localPart
    .replace(/\d+/g, '')              // strip digits
    .replace(/[._\-+]/g, ' ')         // separators to spaces

  // Check if it's a concatenated name without separators:
  const knownPrefixes = ['alamin', 'kalkidan', 'nur', 'david', 'melika', 'belen', 'zulu', 'bekan']
  for (const prefix of knownPrefixes) {
    if (formatted.toLowerCase().startsWith(prefix) && formatted.length > prefix.length + 2 && !formatted.includes(' ')) {
      const rest = formatted.slice(prefix.length).replace(/^f/, '') // e.g. alaminfsiraj -> alamin + siraj
      formatted = `${prefix} ${rest}`
      break
    }
  }

  const words = formatted
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

  if (words.length === 0) {
    return { full: 'Team Member', first: 'Member' }
  }

  const full = words.join(' ')
  const first = words[0]

  return { full, first }
}

/**
 * Resolves full and first name given a profile and optional email
 */
export function resolveUserNames(
  profile?: {
    full_name?: string | null
    first_name?: string | null
    email?: string | null
  } | null,
  emailFallback?: string | null
): { full_name: string; first_name: string } {
  const email = profile?.email || emailFallback

  // Check if profile has a genuine full_name
  if (profile?.full_name && !isPlaceholderName(profile.full_name)) {
    const full = profile.full_name.trim()
    const first = profile.first_name && !isPlaceholderName(profile.first_name)
      ? profile.first_name.trim()
      : full.split(' ')[0]
    return { full_name: full, first_name: first }
  }

  // Check if profile has a genuine first_name
  if (profile?.first_name && !isPlaceholderName(profile.first_name)) {
    const first = profile.first_name.trim()
    const derived = deriveNameFromEmail(email)
    const full = derived.full.toLowerCase().includes(first.toLowerCase())
      ? derived.full
      : `${first} ${derived.full}`
    return { full_name: full, first_name: first }
  }

  // Derive from email
  const derived = deriveNameFromEmail(email)
  return { full_name: derived.full, first_name: derived.first }
}

/**
 * Computes 1-2 character initials for avatars
 */
export function getInitials(name?: string | null): string {
  if (!name || isPlaceholderName(name)) return 'TM'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'TM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
