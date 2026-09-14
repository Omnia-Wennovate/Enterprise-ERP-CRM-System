/**
 * GET /api/integrations
 * Returns all integration configs with real status merged from social_accounts.
 * Any authenticated user may read (read-only overview).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIntegrations } from '@/lib/services/integrations'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const integrations = await getIntegrations()
  return NextResponse.json(integrations)
}
