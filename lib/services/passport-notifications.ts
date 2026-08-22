'use server'

// ============================================================================
// PASSPORT NOTIFICATIONS SERVICE
// Checks passport expiry dates against the 8-calendar-month threshold and
// creates deduplicated alerts in the existing `notifications` table.
// lib/services/passport-notifications.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { getPassportDocuments } from './documents'
import { getPassportStatus, formatPassportRemaining, maskPassportNumber } from './document-validation'

// ── Notification Type Constants ───────────────────────────────────────────────

const PASSPORT_EXPIRING_TYPE = 'PASSPORT_EXPIRING'
const PASSPORT_EXPIRED_TYPE = 'PASSPORT_EXPIRED'

// ── Check and Create Passport Expiry Notifications ───────────────────────────

/**
 * Server-side function that:
 * 1. Fetches all active passport documents
 * 2. Identifies those within the 8-calendar-month window OR already expired
 * 3. For each, checks if a notification of that type already exists (deduplication)
 * 4. Creates the notification ONLY if none exists
 *
 * Safe to call on every page load — idempotent due to deduplication check.
 */
export async function checkAndCreatePassportExpiryNotifications(): Promise<void> {
  const supabase = await createClient()

  try {
    const passports = await getPassportDocuments()
    const active = passports.filter(
      p => p.approval_status !== 'archived' && p.expiry_date
    )

    for (const passport of active) {
      if (!passport.expiry_date) continue

      const status = getPassportStatus(passport.expiry_date)
      if (status === 'valid') continue // No alert needed

      const notifType =
        status === 'expired' ? PASSPORT_EXPIRED_TYPE : PASSPORT_EXPIRING_TYPE

      // Deduplication: check if notification already exists for this document
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', notifType)
        .eq('related_to_id', passport.id)
        .eq('related_to_type', 'document')
        .limit(1)

      if (existing && existing.length > 0) continue // Already notified

      // Build notification content
      const holderName =
        passport.traveler_first_name && passport.traveler_last_name
          ? `${passport.traveler_first_name} ${passport.traveler_last_name}`
          : passport.customer_name || 'Unknown Traveler'

      const passportNumber = passport.ai_extracted_data?.passportNumber
        ? maskPassportNumber(passport.ai_extracted_data.passportNumber)
        : passport.traveler_passport
        ? maskPassportNumber(passport.traveler_passport)
        : '(no number)'

      const remaining = formatPassportRemaining(passport.expiry_date)
      const expiryFormatted = new Date(passport.expiry_date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })

      const bookingPart = passport.booking_reference
        ? ` | Booking: ${passport.booking_reference}`
        : ''
      const destPart = passport.booking_destination
        ? ` | Destination: ${passport.booking_destination}`
        : ''

      const title =
        status === 'expired'
          ? `⚠️ Passport Expired — ${holderName}`
          : `⚠️ Passport Expiring Soon — ${holderName}`

      const message =
        status === 'expired'
          ? `Passport (${passportNumber}) for ${holderName} expired on ${expiryFormatted}. Immediate Operations review required.${bookingPart}${destPart}`
          : `Passport (${passportNumber}) for ${holderName} expires on ${expiryFormatted}. ${remaining}.${bookingPart}${destPart}`

      // Create notification (broadcast to all Operations by leaving recipient_id null)
      await supabase.from('notifications').insert({
        title,
        message,
        type: notifType,
        recipient_id: null,        // Broadcast to all (Operations filter client-side)
        related_to_id: passport.id,
        related_to_type: 'document',
        is_read: false,
      })
    }
  } catch (err) {
    // Non-fatal — log but don't block page load
    console.error('[PassportNotifications] Failed to check passport expiry:', err)
  }
}

// ── Get Active Passport Alerts ────────────────────────────────────────────────

/**
 * Returns passport documents that need Operations attention:
 * - Expiring within 8 calendar months
 * - Already expired
 * Sorted: expired first, then by expiry date ascending.
 */
export async function getPassportAlerts() {
  const passports = await getPassportDocuments()
  const active = passports.filter(
    p => p.approval_status !== 'archived' && p.expiry_date
  )

  return active
    .filter(p => {
      if (!p.expiry_date) return false
      const status = getPassportStatus(p.expiry_date)
      return status === 'expiring_soon' || status === 'expired'
    })
    .sort((a, b) => {
      // Expired first, then by expiry date ascending
      const sa = getPassportStatus(a.expiry_date!)
      const sb = getPassportStatus(b.expiry_date!)
      if (sa === 'expired' && sb !== 'expired') return -1
      if (sb === 'expired' && sa !== 'expired') return 1
      return new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime()
    })
}
