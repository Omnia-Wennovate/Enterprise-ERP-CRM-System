/**
 * POST /api/audit/archive
 * Runs audit log archival for records older than the configured retention period.
 * Super Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { archiveOldAuditLogs } from '@/lib/services/audit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, first_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })
  }

  const displayName = profile?.full_name || profile?.first_name || user.email || 'Super Admin'
  const result = await archiveOldAuditLogs(user.id, displayName)

  if (result.error) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, archived: result.archived })
}
