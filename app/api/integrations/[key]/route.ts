/**
 * GET /api/integrations/[key]
 * Returns a single integration config (with real status merged).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIntegrations } from '@/lib/services/integrations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  const all = await getIntegrations()
  const integration = all.find(i => i.integration_key === key)

  if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(integration)
}
