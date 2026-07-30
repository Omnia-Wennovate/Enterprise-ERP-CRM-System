'use server'

// ============================================================================
// VISA SERVICE — Core visa application CRUD and dashboard queries
// lib/services/visa.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type {
  VisaApplication,
  VisaApplicationWithRelations,
  VisaDashboardKPIs,
  VisaChartData,
  VisaSearchParams,
  VisaStatus,
  ProcessingTimeIntelligence,
} from '@/types/visa'

// ── Fetch All Applications ───────────────────────────────────────────────────

export async function getVisaApplications(limit = 100): Promise<VisaApplication[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_applications')
    .select(`
      *,
      booking_travelers!visa_applications_traveler_id_fkey (
        first_name, last_name, email, phone,
        passport_number, passport_expiry, nationality, date_of_birth
      ),
      bookings!visa_applications_booking_id_fkey (
        booking_reference, destination, customer_name,
        trip_start_date, trip_end_date
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch visa applications: ${error.message}`)

  return (data || []).map(mapVisaApplication)
}

// ── Get by ID with Full Relations ────────────────────────────────────────────

export async function getVisaApplicationById(id: string): Promise<VisaApplicationWithRelations | null> {
  const supabase = await createClient()

  const { data: app, error } = await supabase
    .from('visa_applications')
    .select(`
      *,
      booking_travelers!visa_applications_traveler_id_fkey (
        first_name, last_name, email, phone,
        passport_number, passport_expiry, nationality, date_of_birth
      ),
      bookings!visa_applications_booking_id_fkey (
        booking_reference, destination, customer_name,
        trip_start_date, trip_end_date
      )
    `)
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch visa application: ${error.message}`)
  if (!app) return null

  // Fetch related data in parallel
  const [documents, appointments, timeline, communications, fees, countryRule] = await Promise.all([
    supabase.from('visa_documents').select('*').eq('visa_application_id', id).order('created_at', { ascending: false }),
    supabase.from('visa_appointments').select('*').eq('visa_application_id', id).order('scheduled_datetime', { ascending: true }),
    supabase.from('visa_timeline_events').select('*').eq('visa_application_id', id).order('created_at', { ascending: false }),
    supabase.from('visa_communications').select('*').eq('visa_application_id', id).order('created_at', { ascending: true }),
    supabase.from('visa_fees').select('*').eq('visa_application_id', id).maybeSingle(),
    app.destination_country
      ? supabase.from('country_visa_rules').select('*')
          .eq('destination_country', app.destination_country)
          .eq('nationality', (app as any).booking_travelers?.nationality || '')
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const mapped = mapVisaApplication(app)

  return {
    ...mapped,
    documents: documents.data || [],
    appointments: appointments.data || [],
    timeline: timeline.data || [],
    communications: communications.data || [],
    fees: fees.data || null,
    country_rule: countryRule.data || null,
  }
}

// ── Create Application ───────────────────────────────────────────────────────

export async function createVisaApplication(
  data: Partial<VisaApplication>,
  performedBy?: string,
  performedByName?: string
): Promise<VisaApplication> {
  const supabase = await createClient()

  const payload = {
    booking_id: data.booking_id || null,
    traveler_id: data.traveler_id || null,
    destination_country: data.destination_country,
    visa_type: data.visa_type,
    status: data.status || 'not_started',
    priority: data.priority || 'normal',
    assigned_officer_id: data.assigned_officer_id || null,
    purpose_of_travel: data.purpose_of_travel || null,
    submission_date: data.submission_date || null,
    appointment_date: data.appointment_date || null,
    biometric_date: data.biometric_date || null,
    expected_decision_date: data.expected_decision_date || null,
    notes: data.notes || null,
  }

  const { data: created, error } = await supabase
    .from('visa_applications')
    .insert([payload])
    .select()
    .single()

  if (error) throw new Error(`Failed to create visa application: ${error.message}`)

  // Create timeline event
  await supabase.from('visa_timeline_events').insert([{
    visa_application_id: created.id,
    event_type: 'application_created',
    title: 'Application Created',
    description: `Visa application created for ${data.destination_country} (${data.visa_type})`,
    performed_by: performedBy,
    performed_by_name: performedByName,
  }])

  // Create audit log
  await supabase.from('visa_audit_log').insert([{
    visa_application_id: created.id,
    action: 'application_created',
    performed_by: performedBy,
    performed_by_name: performedByName,
    new_values: payload,
  }])

  return created
}

// ── Update Application ───────────────────────────────────────────────────────

export async function updateVisaApplication(
  id: string,
  updates: Partial<VisaApplication>,
  performedBy?: string,
  performedByName?: string
): Promise<VisaApplication> {
  const supabase = await createClient()

  // Fetch old values for audit
  const { data: oldApp } = await supabase
    .from('visa_applications')
    .select('*')
    .eq('id', id)
    .single()

  const { data: updated, error } = await supabase
    .from('visa_applications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update visa application: ${error.message}`)

  // If status changed, create timeline event
  if (updates.status && oldApp && updates.status !== oldApp.status) {
    await supabase.from('visa_timeline_events').insert([{
      visa_application_id: id,
      event_type: `status_changed_to_${updates.status}`,
      title: 'Status Updated',
      description: `Status changed from "${oldApp.status}" to "${updates.status}"`,
      performed_by: performedBy,
      performed_by_name: performedByName,
      metadata: { old_status: oldApp.status, new_status: updates.status },
    }])
  }

  // Audit log
  await supabase.from('visa_audit_log').insert([{
    visa_application_id: id,
    action: 'application_updated',
    performed_by: performedBy,
    performed_by_name: performedByName,
    old_values: oldApp || {},
    new_values: updates,
  }])

  return updated
}

// ── Delete Application ───────────────────────────────────────────────────────

export async function deleteVisaApplication(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('visa_applications').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete visa application: ${error.message}`)
}

// ── Bulk Create (Section 20) ─────────────────────────────────────────────────

export async function bulkCreateVisaApplications(
  bookingId: string,
  sharedFields: { destination_country: string; visa_type: string; purpose_of_travel?: string; priority?: string },
  performedBy?: string,
  performedByName?: string
): Promise<VisaApplication[]> {
  const supabase = await createClient()

  // Get all travelers for this booking
  const { data: travelers, error: tErr } = await supabase
    .from('booking_travelers')
    .select('*')
    .eq('booking_id', bookingId)

  if (tErr) throw new Error(`Failed to fetch travelers: ${tErr.message}`)
  if (!travelers || travelers.length === 0) throw new Error('No travelers found for this booking')

  // Check for existing visa applications to avoid duplicates
  const { data: existing } = await supabase
    .from('visa_applications')
    .select('traveler_id')
    .eq('booking_id', bookingId)
    .eq('destination_country', sharedFields.destination_country)

  const existingTravelerIds = new Set((existing || []).map((e: any) => e.traveler_id))

  const newApplications = travelers
    .filter((t: any) => !existingTravelerIds.has(t.id))
    .map((t: any) => ({
      booking_id: bookingId,
      traveler_id: t.id,
      destination_country: sharedFields.destination_country,
      visa_type: sharedFields.visa_type,
      purpose_of_travel: sharedFields.purpose_of_travel || null,
      priority: sharedFields.priority || 'normal',
      status: 'not_started',
    }))

  if (newApplications.length === 0) throw new Error('All travelers already have visa applications for this destination')

  const { data: created, error } = await supabase
    .from('visa_applications')
    .insert(newApplications)
    .select()

  if (error) throw new Error(`Failed to bulk create visa applications: ${error.message}`)

  // Create timeline events for each
  const timelineEvents = (created || []).map((app: any) => ({
    visa_application_id: app.id,
    event_type: 'application_created',
    title: 'Application Created (Bulk)',
    description: `Bulk visa application created for ${sharedFields.destination_country}`,
    performed_by: performedBy,
    performed_by_name: performedByName,
  }))

  if (timelineEvents.length > 0) {
    await supabase.from('visa_timeline_events').insert(timelineEvents)
  }

  return created || []
}

// ── Bulk Status Update (Section 20) ──────────────────────────────────────────

export async function bulkUpdateVisaStatus(
  ids: string[],
  status: VisaStatus,
  performedBy?: string,
  performedByName?: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('visa_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw new Error(`Failed to bulk update status: ${error.message}`)

  // Create timeline events
  const events = ids.map(id => ({
    visa_application_id: id,
    event_type: `status_changed_to_${status}`,
    title: 'Status Updated (Bulk)',
    description: `Status bulk-updated to "${status}"`,
    performed_by: performedBy,
    performed_by_name: performedByName,
  }))

  await supabase.from('visa_timeline_events').insert(events)
}

// ── Dashboard KPIs ───────────────────────────────────────────────────────────

export async function getVisaDashboardKPIs(): Promise<VisaDashboardKPIs> {
  const supabase = await createClient()

  const { data: apps, error } = await supabase
    .from('visa_applications')
    .select('id, status, submission_date, decision_date, created_at, expected_decision_date, traveler_id')

  if (error) throw new Error(`Failed to fetch KPIs: ${error.message}`)

  const allApps = apps || []
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Status counts
  const pendingStatuses: VisaStatus[] = ['not_started', 'documents_collecting', 'documents_submitted']
  const reviewStatuses: VisaStatus[] = ['submitted', 'under_review', 'additional_documents_requested']

  const totalApplications = allApps.length
  const pendingApplications = allApps.filter(a => pendingStatuses.includes(a.status)).length
  const approvedApplications = allApps.filter(a => a.status === 'approved' || a.status === 'completed').length
  const rejectedApplications = allApps.filter(a => a.status === 'rejected').length
  const underReviewApplications = allApps.filter(a => reviewStatuses.includes(a.status)).length
  const expiredVisas = allApps.filter(a => a.status === 'expired').length

  // Expiring soon (within 30 days of expected decision)
  const visasExpiringSoon = allApps.filter(a => {
    if (!a.expected_decision_date) return false
    const expDate = new Date(a.expected_decision_date)
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 30
  }).length

  // Submitted today
  const submittedToday = allApps.filter(a => a.created_at?.startsWith(todayStr)).length

  // Passport expiring soon — query travelers
  const travelerIds = allApps.map(a => a.traveler_id).filter(Boolean)
  let passportsExpiringSoon = 0

  if (travelerIds.length > 0) {
    const { data: travelers } = await supabase
      .from('booking_travelers')
      .select('passport_expiry')
      .in('id', travelerIds)
      .not('passport_expiry', 'is', null)

    passportsExpiringSoon = (travelers || []).filter(t => {
      if (!t.passport_expiry) return false
      const expDate = new Date(t.passport_expiry)
      const diffMonths = (expDate.getFullYear() - today.getFullYear()) * 12 + (expDate.getMonth() - today.getMonth())
      return diffMonths <= 6 && diffMonths >= 0
    }).length
  }

  // Average processing time (submission to decision)
  const completedWithDates = allApps.filter(a => a.submission_date && a.decision_date)
  let averageProcessingDays = 0
  if (completedWithDates.length > 0) {
    const totalDays = completedWithDates.reduce((sum, a) => {
      const sub = new Date(a.submission_date!)
      const dec = new Date(a.decision_date!)
      return sum + Math.ceil((dec.getTime() - sub.getTime()) / (1000 * 60 * 60 * 24))
    }, 0)
    averageProcessingDays = Math.round(totalDays / completedWithDates.length)
  }

  return {
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    underReviewApplications,
    expiredVisas,
    visasExpiringSoon,
    passportsExpiringSoon,
    submittedToday,
    averageProcessingDays,
  }
}

// ── Chart Data ───────────────────────────────────────────────────────────────

export async function getVisaChartData(): Promise<VisaChartData> {
  const supabase = await createClient()

  const { data: apps } = await supabase
    .from('visa_applications')
    .select('id, status, destination_country, submission_date, decision_date, created_at')

  const allApps = apps || []

  // Status distribution
  const statusCounts: Record<string, number> = {}
  allApps.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
  })

  const statusColors: Record<string, string> = {
    not_started: '#64748B', documents_collecting: '#F59E0B', submitted: '#8B5CF6',
    under_review: '#6366F1', approved: '#10B981', rejected: '#EF4444',
    completed: '#059669', expired: '#6B7280', cancelled: '#9CA3AF',
  }

  const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: statusColors[name] || '#94A3B8',
  }))

  // Monthly applications (last 12 months)
  const months: string[] = []
  const today = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push(d.toISOString().substring(0, 7))
  }

  const monthlyApplications = months.map(m => {
    const monthApps = allApps.filter(a => a.created_at?.startsWith(m))
    return {
      month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      total: monthApps.length,
      approved: monthApps.filter(a => a.status === 'approved' || a.status === 'completed').length,
      rejected: monthApps.filter(a => a.status === 'rejected').length,
    }
  })

  // Country requests
  const countryCounts: Record<string, number> = {}
  allApps.forEach(a => {
    if (a.destination_country) {
      countryCounts[a.destination_country] = (countryCounts[a.destination_country] || 0) + 1
    }
  })
  const countryRequests = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }))

  // Approval rate
  const decided = allApps.filter(a => a.status === 'approved' || a.status === 'completed' || a.status === 'rejected')
  const approved = decided.filter(a => a.status === 'approved' || a.status === 'completed').length
  const rejected = decided.filter(a => a.status === 'rejected').length

  // Processing time trend
  const processingTimeTrend = months.map(m => {
    const monthCompleted = allApps.filter(a =>
      a.decision_date?.startsWith(m) && a.submission_date
    )
    if (monthCompleted.length === 0) return { month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short' }), avgDays: 0 }

    const totalDays = monthCompleted.reduce((sum, a) => {
      const sub = new Date(a.submission_date!)
      const dec = new Date(a.decision_date!)
      return sum + Math.ceil((dec.getTime() - sub.getTime()) / (1000 * 60 * 60 * 24))
    }, 0)

    return {
      month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short' }),
      avgDays: Math.round(totalDays / monthCompleted.length),
    }
  })

  return {
    statusDistribution,
    monthlyApplications,
    countryRequests,
    approvalRate: { approved, rejected, total: decided.length },
    processingTimeTrend,
  }
}

// ── Search Applications ──────────────────────────────────────────────────────

export async function searchVisaApplications(params: Partial<VisaSearchParams>): Promise<VisaApplication[]> {
  const supabase = await createClient()

  let query = supabase
    .from('visa_applications')
    .select(`
      *,
      booking_travelers!visa_applications_traveler_id_fkey (
        first_name, last_name, email, phone,
        passport_number, passport_expiry, nationality, date_of_birth
      ),
      bookings!visa_applications_booking_id_fkey (
        booking_reference, destination, customer_name,
        trip_start_date, trip_end_date
      )
    `)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.priority) query = query.eq('priority', params.priority)
  if (params.visaType) query = query.eq('visa_type', params.visaType)
  if (params.destination) query = query.ilike('destination_country', `%${params.destination}%`)
  if (params.assignedOfficer) query = query.eq('assigned_officer_id', params.assignedOfficer)
  if (params.dateFrom) query = query.gte('created_at', params.dateFrom)
  if (params.dateTo) query = query.lte('created_at', params.dateTo)

  const { data, error } = await query.limit(200)

  if (error) throw new Error(`Failed to search visa applications: ${error.message}`)

  let results = (data || []).map(mapVisaApplication)

  // Client-side filtering for joined fields
  if (params.query) {
    const q = params.query.toLowerCase()
    results = results.filter(a =>
      a.traveler_first_name?.toLowerCase().includes(q) ||
      a.traveler_last_name?.toLowerCase().includes(q) ||
      a.traveler_passport_number?.toLowerCase().includes(q) ||
      a.booking_reference?.toLowerCase().includes(q) ||
      a.booking_customer_name?.toLowerCase().includes(q) ||
      a.destination_country?.toLowerCase().includes(q)
    )
  }

  if (params.nationality) {
    results = results.filter(a =>
      a.traveler_nationality?.toLowerCase().includes(params.nationality!.toLowerCase())
    )
  }

  if (params.bookingRef) {
    results = results.filter(a =>
      a.booking_reference?.toLowerCase().includes(params.bookingRef!.toLowerCase())
    )
  }

  return results
}

// ── Processing Time Intelligence (Section 21) ────────────────────────────────

export async function getProcessingTimeIntelligence(): Promise<ProcessingTimeIntelligence[]> {
  const supabase = await createClient()

  // Get historical data
  const { data: apps } = await supabase
    .from('visa_applications')
    .select('destination_country, submission_date, decision_date')
    .not('submission_date', 'is', null)
    .not('decision_date', 'is', null)

  const { data: rules } = await supabase
    .from('country_visa_rules')
    .select('destination_country, processing_time_days')

  const ruleMap = new Map((rules || []).map(r => [r.destination_country, r.processing_time_days]))

  // Group by destination
  const byCountry: Record<string, number[]> = {}
  ;(apps || []).forEach(a => {
    if (!a.destination_country || !a.submission_date || !a.decision_date) return
    const days = Math.ceil(
      (new Date(a.decision_date).getTime() - new Date(a.submission_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (days >= 0) {
      if (!byCountry[a.destination_country]) byCountry[a.destination_country] = []
      byCountry[a.destination_country].push(days)
    }
  })

  return Object.entries(byCountry).map(([destination, days]) => {
    const avg = Math.round(days.reduce((s, d) => s + d, 0) / days.length)
    const official = ruleMap.get(destination) || null
    const deviation = official ? Math.round(((avg - official) / official) * 100) : 0

    return {
      destination,
      officialProcessingDays: official,
      actualAverageDays: avg,
      sampleSize: days.length,
      trend: deviation > 20 ? 'slower' : deviation < -20 ? 'faster' : 'stable',
      deviationPercent: deviation,
      lastUpdated: new Date().toISOString(),
    }
  })
}

// ── Audit Log ────────────────────────────────────────────────────────────────

export async function getVisaAuditLog(visaApplicationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_audit_log')
    .select('*')
    .eq('visa_application_id', visaApplicationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch audit log: ${error.message}`)
  return data || []
}

// ── Country Visa Rules ───────────────────────────────────────────────────────

export async function getCountryVisaRules(limit = 100) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('country_visa_rules')
    .select('*')
    .order('destination_country', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch country rules: ${error.message}`)
  return data || []
}

export async function getCountryRule(nationality: string, destination: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('country_visa_rules')
    .select('*')
    .eq('nationality', nationality)
    .eq('destination_country', destination)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch country rule: ${error.message}`)
  return data
}

export async function upsertCountryRule(rule: any) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('country_visa_rules')
    .upsert([{ ...rule, updated_at: new Date().toISOString() }], { onConflict: 'nationality,destination_country' })
    .select()
    .single()

  if (error) throw new Error(`Failed to save country rule: ${error.message}`)
  return data
}

// ── Helper: Map DB row to VisaApplication ────────────────────────────────────

function mapVisaApplication(row: any): VisaApplication {
  const traveler = row.booking_travelers
  const booking = row.bookings

  return {
    id: row.id,
    booking_id: row.booking_id,
    traveler_id: row.traveler_id,
    destination_country: row.destination_country,
    visa_type: row.visa_type,
    status: row.status,
    priority: row.priority || 'normal',
    assigned_officer_id: row.assigned_officer_id,
    purpose_of_travel: row.purpose_of_travel,
    submission_date: row.submission_date,
    appointment_date: row.appointment_date,
    biometric_date: row.biometric_date,
    decision_date: row.decision_date,
    expected_decision_date: row.expected_decision_date,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // Joined traveler fields
    traveler_first_name: traveler?.first_name,
    traveler_last_name: traveler?.last_name,
    traveler_email: traveler?.email,
    traveler_phone: traveler?.phone,
    traveler_passport_number: traveler?.passport_number,
    traveler_passport_expiry: traveler?.passport_expiry,
    traveler_nationality: traveler?.nationality,
    traveler_date_of_birth: traveler?.date_of_birth,
    // Joined booking fields
    booking_reference: booking?.booking_reference,
    booking_destination: booking?.destination,
    booking_customer_name: booking?.customer_name,
    booking_trip_start_date: booking?.trip_start_date,
    booking_trip_end_date: booking?.trip_end_date,
  }
}
