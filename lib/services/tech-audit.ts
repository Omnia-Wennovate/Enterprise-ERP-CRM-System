import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TECH AUDIT LOG
// ============================================================================

export async function logTechAudit(
  action: string,
  tableName: string,
  recordId: string | null,
  performedBy: string | null,
  oldValues: any,
  newValues: any
) {
  const supabase = createClient()
  const { error } = await supabase
    .from('tech_audit_log')
    .insert({
      action,
      table_name: tableName,
      record_id: recordId,
      performed_by: performedBy,
      old_values: oldValues,
      new_values: newValues,
    })

  if (error) console.error('Tech audit log error:', error)
}

export async function getTechAuditLogs(limit = 50) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tech_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
