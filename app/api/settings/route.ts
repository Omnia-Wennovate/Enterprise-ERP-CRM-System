/**
 * GET  /api/settings — returns all settings (or by category)
 * POST /api/settings — saves a setting (super_admin/admin only) + logs audit
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSettings, upsertManySettings } from '@/lib/services/settings'
import { escalateSecuritySettingChange } from '@/lib/services/security-alerts'

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('role, full_name, first_name, email')
    .eq('id', userId)
    .single()
  return data
}

function getIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') as any ?? undefined
  const settings = await getSettings(category)
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getProfile(supabase, user.id)
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { settings } = body as { settings: Array<{ category: string; key: string; value: unknown }> }

  if (!Array.isArray(settings) || settings.length === 0) {
    return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
  }

  const displayName = profile.full_name || profile.first_name || user.email || 'Admin'
  const ip = getIp(req)

  await upsertManySettings(settings, user.id, user.email ?? undefined, displayName, ip)

  // Escalate security category changes
  const securityChanges = settings.filter((s) => s.category === 'security')
  for (const s of securityChanges) {
    await escalateSecuritySettingChange({
      settingKey:      `${s.category}.${s.key}`,
      settingLabel:    s.key,
      performedByName: displayName,
      newValue:        s.value,
    })
  }

  return NextResponse.json({ success: true, saved: settings.length })
}
