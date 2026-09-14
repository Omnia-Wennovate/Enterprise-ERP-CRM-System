/**
 * Audit Log Service
 *
 * Provides server-safe functions to create and query audit log entries.
 * All writes are append-only. The audit_logs table has RLS DENY policies
 * for UPDATE and DELETE — no application code should attempt to modify records.
 *
 * SECURITY: Never log passwords, tokens, refresh tokens, API keys, OAuth secrets,
 * or any sensitive credentials. For sensitive changes, log safe metadata only.
 */

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

export type AuditAction =
  // Auth
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_reset_requested'
  | 'session_expired'
  // User/Employee Management
  | 'user_created'
  | 'user_updated'
  | 'user_activated'
  | 'user_deactivated'
  | 'role_changed'
  | 'department_changed'
  // CRM
  | 'lead_created'
  | 'lead_updated'
  | 'lead_stage_changed'
  | 'lead_deleted'
  | 'customer_created'
  | 'customer_updated'
  | 'quotation_created'
  | 'quotation_sent'
  | 'quotation_accepted'
  // Bookings/Operations
  | 'booking_created'
  | 'booking_updated'
  | 'booking_status_changed'
  | 'booking_cancelled'
  | 'itinerary_created'
  | 'itinerary_updated'
  | 'document_uploaded'
  | 'visa_status_changed'
  // Finance
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_sent'
  | 'payment_recorded'
  | 'expense_submitted'
  | 'expense_approved'
  | 'expense_rejected'
  | 'supplier_payment_created'
  | 'supplier_payment_approved'
  // HR
  | 'leave_requested'
  | 'leave_approved'
  | 'leave_rejected'
  | 'payroll_processed'
  | 'attendance_marked'
  | 'performance_review_created'
  // Communication
  | 'channel_created'
  | 'announcement_posted'
  | 'meeting_scheduled'
  | 'task_created'
  | 'task_completed'
  | 'task_assigned'
  // Settings
  | 'setting_changed'
  | 'role_permission_changed'
  | 'security_setting_changed'
  // Integrations
  | 'integration_connected'
  | 'integration_disconnected'
  | 'integration_sync_started'
  | 'integration_sync_completed'
  | 'integration_sync_failed'
  | 'integration_config_changed'
  // System
  | 'audit_log_archived'
  | 'maintenance_mode_changed'

export type AuditModule =
  | 'auth'
  | 'crm'
  | 'bookings'
  | 'finance'
  | 'hr'
  | 'communication'
  | 'marketing'
  | 'technology'
  | 'settings'
  | 'integrations'
  | 'system'

export interface AuditLogEntry {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  department: string | null
  role: string | null
  action: string
  module: string
  page: string | null
  description: string | null
  entity_type: string | null
  entity_id: string | null
  ip_address: string | null
  user_agent: string | null
  result: 'success' | 'failure' | 'warning'
  before_value: Record<string, unknown> | null
  after_value: Record<string, unknown> | null
  created_at: string
}

export interface LogAuditEventParams {
  userId?: string | null
  userEmail?: string | null
  userName?: string | null
  department?: string | null
  role?: string | null
  action: AuditAction | string
  module: AuditModule | string
  page?: string | null
  description: string
  entityType?: string | null
  entityId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  result?: 'success' | 'failure' | 'warning'
  beforeValue?: Record<string, unknown> | null
  afterValue?: Record<string, unknown> | null
}

export interface AuditFilters {
  search?: string
  userId?: string
  department?: string
  module?: string
  action?: string
  result?: string
  dateFrom?: string
  dateTo?: string
  includeArchived?: boolean
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SuspiciousActivityAlert {
  rule_key: string
  label: string
  description: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  count: number
  threshold: number
  window_minutes: number
  first_event: string
  last_event: string
  severity: 'warning' | 'critical'
}

// ============================================================================
// CREATE AUDIT EVENT
// ============================================================================

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    const supabase = await createClient()

    const entry = {
      user_id:      params.userId     ?? null,
      user_email:   params.userEmail  ?? null,
      user_name:    params.userName   ?? null,
      department:   params.department ?? null,
      role:         params.role       ?? null,
      action:       params.action,
      module:       params.module,
      page:         params.page       ?? null,
      description:  params.description,
      entity_type:  params.entityType ?? null,
      entity_id:    params.entityId   ?? null,
      ip_address:   params.ipAddress  ?? null,
      user_agent:   params.userAgent  ?? null,
      result:       params.result     ?? 'success',
      before_value: params.beforeValue ?? null,
      after_value:  params.afterValue  ?? null,
    }

    await supabase.from('audit_logs').insert(entry)
  } catch {
    // Never let audit logging failures break the main application flow
    console.warn('[AuditLog] Failed to write audit event — silently continuing')
  }
}

// ============================================================================
// READ AUDIT LOGS (paginated, server-side filtered)
// ============================================================================

export async function getAuditLogs(
  filters: AuditFilters = {},
  page = 1,
  pageSize = 25,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PaginatedAuditLogs> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: sortOrder === 'asc' })
    .range(from, to)

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters.department) {
    query = query.eq('department', filters.department)
  }
  if (filters.module) {
    query = query.eq('module', filters.module)
  }
  if (filters.action) {
    query = query.eq('action', filters.action)
  }
  if (filters.result) {
    query = query.eq('result', filters.result)
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', new Date(filters.dateFrom).toISOString())
  }
  if (filters.dateTo) {
    // Include the entire end date
    const endDate = new Date(filters.dateTo)
    endDate.setHours(23, 59, 59, 999)
    query = query.lte('created_at', endDate.toISOString())
  }
  if (filters.search) {
    const term = filters.search.replace(/'/g, "''")
    query = query.or(
      `description.ilike.%${term}%,user_name.ilike.%${term}%,user_email.ilike.%${term}%,entity_type.ilike.%${term}%`
    )
  }

  const { data, error, count } = await query

  if (error) throw error

  const total = count ?? 0
  return {
    data: (data ?? []) as AuditLogEntry[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ============================================================================
// GET ARCHIVED AUDIT LOGS
// ============================================================================

export async function getArchivedAuditLogs(
  filters: AuditFilters = {},
  page = 1,
  pageSize = 25
): Promise<PaginatedAuditLogs> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('audit_logs_archive')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters.module) {
    query = query.eq('module', filters.module)
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', new Date(filters.dateFrom).toISOString())
  }
  if (filters.dateTo) {
    const endDate = new Date(filters.dateTo)
    endDate.setHours(23, 59, 59, 999)
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data, error, count } = await query
  if (error) throw error

  const total = count ?? 0
  return {
    data: (data ?? []) as AuditLogEntry[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ============================================================================
// GET SINGLE AUDIT LOG ENTRY
// ============================================================================

export async function getAuditLogById(id: string): Promise<AuditLogEntry | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as AuditLogEntry
}

// ============================================================================
// GET DISTINCT VALUES FOR FILTER DROPDOWNS
// ============================================================================

export async function getAuditLogFilterOptions(): Promise<{
  modules: string[]
  actions: string[]
  departments: string[]
}> {
  const supabase = await createClient()

  const [modulesRes, actionsRes, deptsRes] = await Promise.all([
    supabase.from('audit_logs').select('module').limit(1000),
    supabase.from('audit_logs').select('action').limit(1000),
    supabase.from('audit_logs').select('department').limit(1000),
  ])

  const unique = <T>(arr: T[] | null | undefined) =>
    [...new Set((arr ?? []).filter(Boolean))] as T[]

  return {
    modules:     unique(modulesRes.data?.map((r: any) => r.module)),
    actions:     unique(actionsRes.data?.map((r: any) => r.action)),
    departments: unique(deptsRes.data?.map((r: any) => r.department).filter(Boolean)),
  }
}

// ============================================================================
// ARCHIVE OLD AUDIT LOGS (retention policy)
// ============================================================================

export async function archiveOldAuditLogs(
  performedByUserId: string,
  performedByUserName: string
): Promise<{ archived: number; error?: string }> {
  const supabase = await createClient()

  try {
    // Read retention period from settings
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('category', 'system')
      .eq('key', 'audit_retention_months')
      .single()

    const months = parseInt(String((setting?.value as any) ?? 24), 10) || 24
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    // Fetch records to archive
    const { data: toArchive, error: fetchError } = await supabase
      .from('audit_logs')
      .select('*')
      .lt('created_at', cutoffDate.toISOString())
      .limit(5000) // batch limit

    if (fetchError) throw fetchError
    if (!toArchive || toArchive.length === 0) {
      return { archived: 0 }
    }

    // Insert into archive table
    const archiveRows = toArchive.map((row: any) => ({
      ...row,
      original_id: row.id,
      archived_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('audit_logs_archive')
      .insert(archiveRows)

    if (insertError) throw insertError

    const archivedIds = toArchive.map((r: any) => r.id)

    // Log the archival action BEFORE deleting
    await logAuditEvent({
      userId: performedByUserId,
      userName: performedByUserName,
      action: 'audit_log_archived',
      module: 'system',
      page: '/settings',
      description: `Archived ${archivedIds.length} audit log entries older than ${months} months (before ${cutoffDate.toISOString().split('T')[0]})`,
      entityType: 'audit_log',
      result: 'success',
      afterValue: {
        archived_count: archivedIds.length,
        cutoff_date: cutoffDate.toISOString(),
        retention_months: months,
      },
    })

    // Now delete the archived records from hot table
    // We chunk to avoid query size limits
    const CHUNK_SIZE = 500
    for (let i = 0; i < archivedIds.length; i += CHUNK_SIZE) {
      const chunk = archivedIds.slice(i, i + CHUNK_SIZE)
      await supabase.from('audit_logs').delete().in('id', chunk)
    }

    return { archived: toArchive.length }
  } catch (err: any) {
    console.error('[AuditLog] Archive failed:', err)
    return { archived: 0, error: err?.message || 'Unknown error' }
  }
}

// ============================================================================
// SUSPICIOUS ACTIVITY DETECTION (Section 20 — deterministic rules)
// ============================================================================

export async function detectSuspiciousActivity(): Promise<SuspiciousActivityAlert[]> {
  const supabase = await createClient()
  const alerts: SuspiciousActivityAlert[] = []

  // Load rule thresholds from DB
  const { data: rules } = await supabase
    .from('security_alert_rules')
    .select('*')
    .eq('is_enabled', true)

  const ruleMap = Object.fromEntries((rules ?? []).map((r: any) => [r.rule_key, r]))

  // ── Rule 1: Repeated failed logins ─────────────────────────────────────────
  const r1 = ruleMap['repeated_failed_logins']
  if (r1) {
    const windowStart = new Date(Date.now() - r1.threshold_minutes * 60 * 1000).toISOString()
    const { data: failedLogins } = await supabase
      .from('audit_logs')
      .select('user_id, user_email, user_name, created_at')
      .eq('action', 'login_failed')
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })

    if (failedLogins && failedLogins.length > 0) {
      // Group by user
      const byUser = new Map<string, typeof failedLogins>()
      for (const row of failedLogins) {
        const key = (row as any).user_email ?? (row as any).user_id ?? 'unknown'
        if (!byUser.has(key)) byUser.set(key, [])
        byUser.get(key)!.push(row as any)
      }
      for (const [, events] of byUser) {
        if (events.length >= r1.threshold_count) {
          const first = events[0] as any
          const last = events[events.length - 1] as any
          alerts.push({
            rule_key:       'repeated_failed_logins',
            label:          r1.label,
            description:    `${events.length} failed login attempts in ${r1.threshold_minutes} minutes — Rule: ≥${r1.threshold_count} failures in ${r1.threshold_minutes} min`,
            user_id:        first.user_id,
            user_email:     first.user_email,
            user_name:      first.user_name,
            count:          events.length,
            threshold:      r1.threshold_count,
            window_minutes: r1.threshold_minutes,
            first_event:    first.created_at,
            last_event:     last.created_at,
            severity:       events.length >= r1.threshold_count * 2 ? 'critical' : 'warning',
          })
        }
      }
    }
  }

  // ── Rule 2: High-volume deletions ──────────────────────────────────────────
  const r2 = ruleMap['high_volume_deletions']
  if (r2) {
    const windowStart = new Date(Date.now() - r2.threshold_minutes * 60 * 1000).toISOString()
    const { data: deletions } = await supabase
      .from('audit_logs')
      .select('user_id, user_email, user_name, created_at')
      .ilike('action', '%delete%')
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })

    if (deletions && deletions.length > 0) {
      const byUser = new Map<string, typeof deletions>()
      for (const row of deletions) {
        const key = (row as any).user_id ?? 'unknown'
        if (!byUser.has(key)) byUser.set(key, [])
        byUser.get(key)!.push(row as any)
      }
      for (const [, events] of byUser) {
        if (events.length >= r2.threshold_count) {
          const first = events[0] as any
          const last = events[events.length - 1] as any
          alerts.push({
            rule_key:       'high_volume_deletions',
            label:          r2.label,
            description:    `${events.length} deletion/removal actions in ${r2.threshold_minutes} minutes — Rule: ≥${r2.threshold_count} in ${r2.threshold_minutes} min`,
            user_id:        first.user_id,
            user_email:     first.user_email,
            user_name:      first.user_name,
            count:          events.length,
            threshold:      r2.threshold_count,
            window_minutes: r2.threshold_minutes,
            first_event:    first.created_at,
            last_event:     last.created_at,
            severity:       'critical',
          })
        }
      }
    }
  }

  // ── Rule 3: Rapid IP change (same user, 2 different IPs within short window) ─
  const r3 = ruleMap['rapid_location_change']
  if (r3) {
    const windowStart = new Date(Date.now() - r3.threshold_minutes * 60 * 1000).toISOString()
    const { data: logins } = await supabase
      .from('audit_logs')
      .select('user_id, user_email, user_name, ip_address, created_at')
      .eq('action', 'login_success')
      .gte('created_at', windowStart)
      .not('ip_address', 'is', null)
      .order('created_at', { ascending: true })

    if (logins && logins.length > 0) {
      const byUser = new Map<string, { ips: Set<string>; events: any[] }>()
      for (const row of logins) {
        const r = row as any
        if (!r.user_id) continue
        if (!byUser.has(r.user_id)) byUser.set(r.user_id, { ips: new Set(), events: [] })
        const entry = byUser.get(r.user_id)!
        entry.ips.add(r.ip_address)
        entry.events.push(r)
      }
      for (const [userId, entry] of byUser) {
        if (entry.ips.size >= 2) {
          const first = entry.events[0]
          const last = entry.events[entry.events.length - 1]
          alerts.push({
            rule_key:       'rapid_location_change',
            label:          r3.label,
            description:    `Login from ${entry.ips.size} different IP addresses within ${r3.threshold_minutes} minutes — Rule: ≥${r3.threshold_count} IPs in ${r3.threshold_minutes} min`,
            user_id:        userId,
            user_email:     first.user_email,
            user_name:      first.user_name,
            count:          entry.ips.size,
            threshold:      r3.threshold_count,
            window_minutes: r3.threshold_minutes,
            first_event:    first.created_at,
            last_event:     last.created_at,
            severity:       'warning',
          })
        }
      }
    }
  }

  return alerts
}
