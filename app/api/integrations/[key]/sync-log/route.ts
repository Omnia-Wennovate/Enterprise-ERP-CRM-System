/**
 * GET /api/integrations/[key]/sync-log
 * Returns recent sync log entries for a given integration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSyncLog } from '@/lib/services/integrations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  const log = await getSyncLog(key, 20)
  return NextResponse.json(log)
}
