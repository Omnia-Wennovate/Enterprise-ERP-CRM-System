/**
 * Security Alerts Service
 *
 * Bridges the audit log's suspicious-activity detection (Section 20) with the
 * existing notifications system (Section 18). Uses the SAME notifications table
 * and createNotification() function — no second notification system created.
 */

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// FIND SUPER ADMIN PROFILE ID
// ============================================================================

async function getSuperAdminId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'super_admin')
    .eq('is_active', true)
    .limit(1)
    .single()
  return data?.id ?? null
}

// ============================================================================
// NOTIFY SUPER ADMIN (reuses existing notifications table)
// ============================================================================

export async function notifySuperAdmin(params: {
  title: string
  message: string
  type: string
  relatedToId?: string
  relatedToType?: string
}): Promise<void> {
  try {
    const supabase = await createClient()
    const superAdminId = await getSuperAdminId()

    await supabase.from('notifications').insert({
      title:            params.title,
      message:          params.message,
      type:             params.type,
      recipient_id:     superAdminId,
      related_to_id:    params.relatedToId   ?? null,
      related_to_type:  params.relatedToType ?? null,
      is_read:          false,
    })
  } catch {
    // Never block the main flow — notifications are non-critical
    console.warn('[SecurityAlerts] Failed to send super admin notification')
  }
}

// ============================================================================
// ESCALATION TRIGGERS
// ============================================================================

/** Called when a role or permission is changed. */
export async function escalateRoleChange(params: {
  changedUserId: string
  changedUserEmail: string
  performedByName: string
  oldRole: string
  newRole: string
}): Promise<void> {
  await notifySuperAdmin({
    title:          '⚠️ Role Permission Changed',
    message:        `${params.performedByName} changed the role of ${params.changedUserEmail} from "${params.oldRole}" to "${params.newRole}"`,
    type:           'security_role_change',
    relatedToId:    params.changedUserId,
    relatedToType:  'profile',
  })
}

/** Called when an integration is disconnected or its token/connection fails. */
export async function escalateIntegrationIssue(params: {
  integrationKey: string
  displayName: string
  issue: 'disconnected' | 'error' | 'token_expired'
  errorDetail?: string
}): Promise<void> {
  const issueLabel =
    params.issue === 'disconnected' ? 'Disconnected'
    : params.issue === 'token_expired' ? 'Token Expired'
    : 'Connection Error'

  await notifySuperAdmin({
    title:          `🔌 Integration ${issueLabel}: ${params.displayName}`,
    message:        params.errorDetail
      ? `The "${params.displayName}" integration has ${issueLabel.toLowerCase()}. Details: ${params.errorDetail}`
      : `The "${params.displayName}" integration has ${issueLabel.toLowerCase()}.`,
    type:           'integration_issue',
    relatedToId:    params.integrationKey,
    relatedToType:  'integration',
  })
}

/** Called when security category settings change. */
export async function escalateSecuritySettingChange(params: {
  settingKey: string
  settingLabel: string
  performedByName: string
  newValue: unknown
}): Promise<void> {
  await notifySuperAdmin({
    title:          '🔒 Security Setting Changed',
    message:        `${params.performedByName} changed the security setting "${params.settingLabel}"`,
    type:           'security_setting_change',
    relatedToId:    params.settingKey,
    relatedToType:  'system_setting',
  })
}

/** Called when failed login threshold is crossed. */
export async function escalateRepeatedFailedLogins(params: {
  userEmail: string
  count: number
  windowMinutes: number
}): Promise<void> {
  await notifySuperAdmin({
    title:          '🚨 Repeated Failed Logins Detected',
    message:        `Account "${params.userEmail}" has failed to log in ${params.count} times within the last ${params.windowMinutes} minutes. This may indicate a brute-force attempt.`,
    type:           'security_failed_logins',
    relatedToId:    params.userEmail,
    relatedToType:  'auth_event',
  })
}
