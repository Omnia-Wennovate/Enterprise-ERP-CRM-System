/**
 * System Settings Service
 *
 * Reads and writes from the system_settings table.
 * Every write creates an audit log entry.
 */

import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from './audit'

// ============================================================================
// TYPES
// ============================================================================

export interface SystemSetting {
  id: string
  category: string
  key: string
  value: unknown
  label: string | null
  description: string | null
  updated_by: string | null
  updated_at: string
  created_at: string
}

export type SettingCategory =
  | 'general'
  | 'crm'
  | 'bookings'
  | 'finance'
  | 'hr'
  | 'communication'
  | 'security'
  | 'system'

// ============================================================================
// READ SETTINGS
// ============================================================================

export async function getSettings(category?: SettingCategory): Promise<SystemSetting[]> {
  const supabase = await createClient()
  let query = supabase
    .from('system_settings')
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as SystemSetting[]
}

export async function getSettingsByCategory(): Promise<Record<string, Record<string, unknown>>> {
  const settings = await getSettings()
  const result: Record<string, Record<string, unknown>> = {}
  for (const s of settings) {
    if (!result[s.category]) result[s.category] = {}
    result[s.category][s.key] = s.value
  }
  return result
}

export async function getSetting(category: string, key: string): Promise<unknown> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('category', category)
    .eq('key', key)
    .single()
  return data?.value ?? null
}

// ============================================================================
// WRITE SETTINGS
// ============================================================================

export interface UpsertSettingParams {
  category: string
  key: string
  value: unknown
  userId: string
  userEmail?: string
  userName?: string
  ipAddress?: string
}

export async function upsertSetting(params: UpsertSettingParams): Promise<void> {
  const supabase = await createClient()

  // Read current value for audit before/after
  const { data: current } = await supabase
    .from('system_settings')
    .select('value, label')
    .eq('category', params.category)
    .eq('key', params.key)
    .single()

  const { error } = await supabase
    .from('system_settings')
    .upsert(
      {
        category:   params.category,
        key:        params.key,
        value:      params.value,
        updated_by: params.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'category,key' }
    )

  if (error) throw error

  // Determine if this is a security setting change
  const isSecuritySetting = params.category === 'security'
  const action = isSecuritySetting ? 'security_setting_changed' : 'setting_changed'
  const module = 'settings'

  await logAuditEvent({
    userId:      params.userId,
    userEmail:   params.userEmail,
    userName:    params.userName,
    action,
    module,
    page:        '/settings',
    description: `Setting "${params.category}.${params.key}" changed to "${JSON.stringify(params.value)}"`,
    entityType:  'system_setting',
    entityId:    `${params.category}.${params.key}`,
    ipAddress:   params.ipAddress,
    result:      'success',
    beforeValue: current ? { value: current.value, label: current.label } : null,
    afterValue:  { value: params.value, category: params.category, key: params.key },
  })
}

export async function upsertManySettings(
  settings: Array<{ category: string; key: string; value: unknown }>,
  userId: string,
  userEmail?: string,
  userName?: string,
  ipAddress?: string
): Promise<void> {
  for (const s of settings) {
    await upsertSetting({ ...s, userId, userEmail, userName, ipAddress })
  }
}

// ============================================================================
// GET AUDIT RETENTION MONTHS
// ============================================================================

export async function getAuditRetentionMonths(): Promise<number> {
  const value = await getSetting('system', 'audit_retention_months')
  return parseInt(String(value ?? 24), 10) || 24
}
