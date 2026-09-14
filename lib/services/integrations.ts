/**
 * Integrations Service
 *
 * Manages integration configs and sync log entries.
 * Reads real connection status from both integration_configs and social_accounts tables.
 * Never handles tokens, secrets, or credentials.
 */

import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from './audit'

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationStatus =
  | 'connected'
  | 'disconnected'
  | 'not_configured'
  | 'error'
  | 'needs_attention'
  | 'syncing'

export type IntegrationCategory =
  | 'social_media'
  | 'email'
  | 'storage'
  | 'auth'
  | 'analytics'
  | 'communication'

export interface IntegrationConfig {
  id: string
  integration_key: string
  display_name: string
  category: IntegrationCategory
  is_enabled: boolean
  connection_status: IntegrationStatus
  connected_account_name: string | null
  connected_account_id: string | null   // safe platform ID, not a token
  last_sync_at: string | null
  last_sync_status: string | null
  last_sync_error: string | null
  records_processed: number | null
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SyncLogEntry {
  id: string
  integration_key: string
  status: string
  records_processed: number | null
  error_message: string | null
  triggered_by: string
  triggered_by_user: string | null
  started_at: string
  completed_at: string | null
}

// ============================================================================
// READ INTEGRATIONS
// ============================================================================

export async function getIntegrations(): Promise<IntegrationConfig[]> {
  const supabase = await createClient()

  // Get base integration configs
  const { data: configs, error } = await supabase
    .from('integration_configs')
    .select('*')
    .order('category', { ascending: true })
    .order('display_name', { ascending: true })

  if (error) throw error

  // Merge with real social_accounts data where applicable
  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('platform, status, connection_status, account_name, external_account_id, last_sync_at, last_sync_status')
    .order('platform', { ascending: true })

  const socialMap: Record<string, any> = {}
  for (const acc of (socialAccounts ?? [])) {
    socialMap[acc.platform.toLowerCase()] = acc
  }

  return (configs ?? []).map((cfg: any) => {
    const social = socialMap[cfg.integration_key]
    if (social) {
      // Real connection status comes from the social_accounts table
      return {
        ...cfg,
        connection_status:      deriveStatus(social),
        connected_account_name: social.account_name ?? cfg.connected_account_name,
        connected_account_id:   social.external_account_id ?? null,
        last_sync_at:           social.last_sync_at ?? cfg.last_sync_at,
        last_sync_status:       social.last_sync_status ?? cfg.last_sync_status,
      } as IntegrationConfig
    }
    return cfg as IntegrationConfig
  })
}

function deriveStatus(social: any): IntegrationStatus {
  if (!social) return 'not_configured'
  if (social.connection_status === 'oauth_connected' && social.status === 'connected') return 'connected'
  if (social.connection_status === 'manual' && !social.external_account_id) return 'not_configured'
  if (social.api_status === 'error') return 'error'
  if (social.status === 'disconnected') return 'disconnected'
  return 'not_configured'
}

export async function getIntegrationByKey(key: string): Promise<IntegrationConfig | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('integration_key', key)
    .single()

  if (error || !data) return null
  return data as IntegrationConfig
}

export async function getSyncLog(integrationKey: string, limit = 20): Promise<SyncLogEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('integration_sync_log')
    .select('*')
    .eq('integration_key', integrationKey)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as SyncLogEntry[]
}

// ============================================================================
// UPDATE INTEGRATION STATUS
// ============================================================================

export async function updateIntegrationStatus(
  integrationKey: string,
  status: IntegrationStatus,
  meta?: {
    connectedAccountName?: string
    connectedAccountId?: string
    error?: string
  },
  performedBy?: { userId: string; userEmail?: string; userName?: string; ipAddress?: string }
): Promise<void> {
  const supabase = await createClient()

  const update: Record<string, unknown> = {
    connection_status: status,
    updated_at: new Date().toISOString(),
  }
  if (meta?.connectedAccountName !== undefined) update.connected_account_name = meta.connectedAccountName
  if (meta?.connectedAccountId !== undefined) update.connected_account_id = meta.connectedAccountId
  if (meta?.error !== undefined) update.last_sync_error = meta.error

  const { error } = await supabase
    .from('integration_configs')
    .update(update)
    .eq('integration_key', integrationKey)

  if (error) throw error

  // Audit log
  const action = status === 'connected'
    ? 'integration_connected'
    : status === 'disconnected'
    ? 'integration_disconnected'
    : 'integration_config_changed'

  if (performedBy) {
    await logAuditEvent({
      userId:      performedBy.userId,
      userEmail:   performedBy.userEmail,
      userName:    performedBy.userName,
      action,
      module:      'integrations',
      page:        `/integrations/${integrationKey}`,
      description: `Integration "${integrationKey}" status changed to "${status}"`,
      entityType:  'integration',
      entityId:    integrationKey,
      ipAddress:   performedBy.ipAddress,
      result:      'success',
      afterValue:  { status, account: meta?.connectedAccountName },
    })
  }
}

// ============================================================================
// RECORD SYNC RESULT
// ============================================================================

export async function recordSyncResult(params: {
  integrationKey: string
  status: 'started' | 'success' | 'failure' | 'partial'
  recordsProcessed?: number
  errorMessage?: string
  triggeredBy?: string
  triggeredByUserId?: string
  completedAt?: string
}): Promise<void> {
  const supabase = await createClient()

  const now = new Date().toISOString()

  // Insert sync log entry
  await supabase.from('integration_sync_log').insert({
    integration_key:   params.integrationKey,
    status:            params.status,
    records_processed: params.recordsProcessed ?? null,
    error_message:     params.errorMessage ?? null,
    triggered_by:      params.triggeredBy ?? 'manual',
    triggered_by_user: params.triggeredByUserId ?? null,
    started_at:        now,
    completed_at:      params.completedAt ?? now,
  })

  // Update integration_configs with latest sync info
  const update: Record<string, unknown> = {
    last_sync_at:     now,
    last_sync_status: params.status,
    updated_at:       now,
  }
  if (params.recordsProcessed !== undefined) update.records_processed = params.recordsProcessed
  if (params.errorMessage) {
    update.last_sync_error = params.errorMessage
    if (params.status === 'failure') update.connection_status = 'error'
  } else if (params.status === 'success') {
    update.last_sync_error = null
    update.connection_status = 'connected'
  }

  await supabase
    .from('integration_configs')
    .update(update)
    .eq('integration_key', params.integrationKey)
}
