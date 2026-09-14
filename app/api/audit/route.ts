/**
 * GET /api/audit
 * Server-side paginated audit log query. Super Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuditLogs, getAuditLogFilterOptions, detectSuspiciousActivity } from '@/lib/services/audit'

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await assertSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page     = parseInt(searchParams.get('page')     ?? '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10)
  const sort     = (searchParams.get('sort') ?? 'desc') as 'asc' | 'desc'
  const alerts   = searchParams.get('alerts') === 'true'
  const options  = searchParams.get('options') === 'true'

  if (options) {
    const filterOptions = await getAuditLogFilterOptions()
    return NextResponse.json(filterOptions)
  }

  if (alerts) {
    const suspicious = await detectSuspiciousActivity()
    return NextResponse.json(suspicious)
  }

  const filters = {
    search:     searchParams.get('search')     ?? undefined,
    userId:     searchParams.get('userId')     ?? undefined,
    department: searchParams.get('department') ?? undefined,
    module:     searchParams.get('module')     ?? undefined,
    action:     searchParams.get('action')     ?? undefined,
    result:     searchParams.get('result')     ?? undefined,
    dateFrom:   searchParams.get('dateFrom')   ?? undefined,
    dateTo:     searchParams.get('dateTo')     ?? undefined,
  }

  const result = await getAuditLogs(filters, page, Math.min(pageSize, 100), sort)
  return NextResponse.json(result)
}
