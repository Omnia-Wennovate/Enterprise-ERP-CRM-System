/**
 * POST /api/audit/log-event
 * Receives audit event data from client components (e.g., login form)
 * and writes it server-side where we can read request headers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Extract IP from request headers (server-side only)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip')
      ?? null
    const userAgent = req.headers.get('user-agent') ?? null

    const supabase = await createClient()

    await supabase.from('audit_logs').insert({
      user_id:      body.userId     ?? null,
      user_email:   body.userEmail  ?? null,
      user_name:    body.userName   ?? null,
      department:   body.department ?? null,
      role:         body.role       ?? null,
      action:       body.action,
      module:       body.module     ?? 'auth',
      page:         body.page       ?? '/login',
      description:  body.description,
      entity_type:  body.entityType ?? null,
      entity_id:    body.entityId   ?? null,
      ip_address:   ip,
      user_agent:   userAgent,
      result:       body.result     ?? 'success',
      before_value: body.beforeValue ?? null,
      after_value:  body.afterValue  ?? null,
    })

    // Check for repeated failed logins and escalate if threshold crossed
    if (body.action === 'login_failed' && body.userEmail) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login_failed')
        .eq('user_email', body.userEmail)
        .gte('created_at', tenMinutesAgo)

      // Get threshold from settings
      const { data: ruleSetting } = await supabase
        .from('security_alert_rules')
        .select('threshold_count')
        .eq('rule_key', 'repeated_failed_logins')
        .single()

      const threshold = ruleSetting?.threshold_count ?? 5

      if ((count ?? 0) >= threshold) {
        // Notify super admin via existing notifications table
        const { data: superAdmin } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'super_admin')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (superAdmin) {
          await supabase.from('notifications').insert({
            title:           '🚨 Repeated Failed Logins',
            message:         `Account "${body.userEmail}" has failed to log in ${count} times in the last 10 minutes. Possible brute-force attempt.`,
            type:            'security_failed_logins',
            recipient_id:    superAdmin.id,
            related_to_id:   body.userEmail,
            related_to_type: 'auth_event',
            is_read:         false,
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // Never block the calling flow
    console.warn('[AuditLog] log-event API error:', err?.message)
    return NextResponse.json({ ok: false }, { status: 200 }) // still 200 so client doesn't retry
  }
}
