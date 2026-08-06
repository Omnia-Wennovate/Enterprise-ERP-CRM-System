'use server'

// ============================================================================
// DOCUMENTS SERVICE — Core CRUD, Dashboard KPIs, Search
// lib/services/documents.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type {
  Document,
  DocumentSearchParams,
  DocumentDashboardKPIs,
  DocumentChartData,
  DocumentApprovalStatus,
  DocumentType,
} from '@/types/documents'

// ── Helper: map raw row to Document ──────────────────────────────────────────

function mapDocument(row: any): Document {
  const traveler = row.booking_travelers
  const booking = row.bookings
  const uploader = row.profiles
  const updater = row.updater_profile

  return {
    ...row,
    traveler_first_name: traveler?.first_name ?? null,
    traveler_last_name: traveler?.last_name ?? null,
    traveler_passport: traveler?.passport_number ?? null,
    traveler_nationality: traveler?.nationality ?? null,
    booking_reference: booking?.booking_reference ?? null,
    booking_destination: booking?.destination ?? null,
    customer_name: booking?.customer_name ?? null,
    uploaded_by_name: uploader ? `${uploader.first_name || ''} ${uploader.last_name || ''}`.trim() || null : null,
    updated_by_name: updater ? `${updater.first_name || ''} ${updater.last_name || ''}`.trim() || null : null,
  }
}

// ── Fetch All Documents ───────────────────────────────────────────────────────

export async function getDocuments(params?: DocumentSearchParams): Promise<Document[]> {
  const supabase = await createClient()

  let query = supabase
    .from('documents')
    .select(`
      *,
      booking_travelers!documents_traveler_id_fkey(first_name, last_name, passport_number, nationality),
      bookings!documents_booking_id_fkey(booking_reference, destination, customer_name),
      profiles!documents_uploaded_by_fkey(first_name, last_name),
      updater_profile:profiles!documents_updated_by_fkey(first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (params?.booking_id) query = query.eq('booking_id', params.booking_id)
  if (params?.traveler_id) query = query.eq('traveler_id', params.traveler_id)
  if (params?.document_type && params.document_type !== 'all') {
    query = query.eq('document_type', params.document_type)
  }
  if (params?.approval_status && params.approval_status !== 'all') {
    query = query.eq('approval_status', params.approval_status)
  }
  if (params?.country) query = query.ilike('country', `%${params.country}%`)
  if (params?.has_legal_hold !== undefined) query = query.eq('legal_hold', params.has_legal_hold)
  if (params?.expiry_from) query = query.gte('expiry_date', params.expiry_from)
  if (params?.expiry_to) query = query.lte('expiry_date', params.expiry_to)
  if (params?.uploaded_from) query = query.gte('created_at', params.uploaded_from)
  if (params?.uploaded_to) query = query.lte('created_at', params.uploaded_to)

  if (params?.limit) query = query.limit(params.limit)
  if (params?.offset) query = query.range(params.offset, (params.offset + (params.limit ?? 50)) - 1)

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch documents: ${error.message}`)
  return (data || []).map(mapDocument)
}

// ── Full-Text Search ──────────────────────────────────────────────────────────

export async function searchDocuments(params: DocumentSearchParams): Promise<Document[]> {
  const supabase = await createClient()

  if (params.query) {
    // Search by booking reference
    const { data: byBooking } = await supabase
      .from('documents')
      .select(`
        *,
        booking_travelers!documents_traveler_id_fkey(first_name, last_name, passport_number, nationality),
        bookings!documents_booking_id_fkey(booking_reference, destination, customer_name),
        profiles!documents_uploaded_by_fkey(first_name, last_name),
        updater_profile:profiles!documents_updated_by_fkey(first_name, last_name)
      `)
      .ilike('document_name', `%${params.query}%`)
      .limit(100)

    return (byBooking || []).map(mapDocument)
  }

  return getDocuments(params)
}

// ── Get by ID ─────────────────────────────────────────────────────────────────

export async function getDocumentById(id: string): Promise<Document | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      booking_travelers!documents_traveler_id_fkey(first_name, last_name, passport_number, nationality),
      bookings!documents_booking_id_fkey(booking_reference, destination, customer_name, trip_start_date, trip_end_date),
      profiles!documents_uploaded_by_fkey(first_name, last_name),
      updater_profile:profiles!documents_updated_by_fkey(first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch document: ${error.message}`)
  if (!data) return null

  return mapDocument(data)
}

// ── Create Document ───────────────────────────────────────────────────────────

export async function createDocument(doc: Partial<Document>): Promise<Document> {
  const supabase = await createClient()

  const payload = {
    ...doc,
    folder: doc.folder || 'general',
    approval_status: doc.approval_status ?? 'draft',
    version: 1,
    download_count: 0,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('documents')
    .insert([payload])
    .select()
    .single()

  if (error) throw new Error(`Failed to create document: ${error.message}`)

  // Log access
  if (doc.uploaded_by) {
    await supabase.from('document_access_log').insert([{
      document_id: data.id,
      accessed_by: doc.uploaded_by,
      action: 'upload',
      booking_id: doc.booking_id,
    }])
  }

  return data
}

// ── Update Document ───────────────────────────────────────────────────────────

export async function updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update document: ${error.message}`)
  return data
}

// ── Delete Document (soft archive) ────────────────────────────────────────────

export async function deleteDocument(id: string, userId?: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('documents')
    .update({ approval_status: 'archived', updated_at: new Date().toISOString(), updated_by: userId })
    .eq('id', id)

  if (error) throw new Error(`Failed to archive document: ${error.message}`)

  if (userId) {
    await supabase.from('document_access_log').insert([{
      document_id: id,
      accessed_by: userId,
      action: 'archive',
    }])
  }
}

// ── Bulk Actions ──────────────────────────────────────────────────────────────

export async function bulkArchiveDocuments(ids: string[], userId?: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('documents')
    .update({ approval_status: 'archived', updated_at: new Date().toISOString(), updated_by: userId })
    .in('id', ids)
}

export async function bulkApproveDocuments(ids: string[], userId?: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('documents')
    .update({ approval_status: 'approved', updated_at: new Date().toISOString(), updated_by: userId })
    .in('id', ids)

  if (userId) {
    await supabase.from('document_access_log').insert(
      ids.map(id => ({ document_id: id, accessed_by: userId, action: 'approve' }))
    )
  }
}

export async function incrementDownloadCount(id: string, userId?: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment', { table: 'documents', column: 'download_count', row_id: id }).catch(() => {
    // Fallback if RPC not available
    supabase.from('documents').select('download_count').eq('id', id).single().then(({ data }) => {
      if (data) {
        supabase.from('documents').update({ download_count: (data.download_count || 0) + 1 }).eq('id', id)
      }
    })
  })

  if (userId) {
    await supabase.from('document_access_log').insert([{
      document_id: id,
      accessed_by: userId,
      action: 'download',
    }])
  }
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

export async function getDocumentDashboardKPIs(): Promise<DocumentDashboardKPIs> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [all, byStatus, byType, expiredDocs, expiringSoonDocs, legalHold] = await Promise.all([
    supabase.from('documents').select('id', { count: 'exact', head: true }),
    supabase.from('documents').select('approval_status'),
    supabase.from('documents').select('document_type'),
    supabase.from('documents').select('id', { count: 'exact', head: true })
      .lt('expiry_date', today).neq('approval_status', 'archived'),
    supabase.from('documents').select('id', { count: 'exact', head: true })
      .gte('expiry_date', today).lte('expiry_date', in30Days).neq('approval_status', 'archived'),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('legal_hold', true),
  ])

  const statusCounts = (byStatus.data || []).reduce((acc: Record<string, number>, row) => {
    acc[row.approval_status] = (acc[row.approval_status] || 0) + 1
    return acc
  }, {})

  const typeCounts = (byType.data || []).reduce((acc: Record<string, number>, row) => {
    acc[row.document_type] = (acc[row.document_type] || 0) + 1
    return acc
  }, {})

  return {
    totalDocuments: all.count || 0,
    pendingDocuments: statusCounts['pending_review'] || 0,
    approvedDocuments: statusCounts['approved'] || 0,
    expiredDocuments: expiredDocs.count || 0,
    expiringSoon: expiringSoonDocs.count || 0,
    missingDocuments: 0, // calculated via checklist service
    passportCount: typeCounts['passport'] || 0,
    visaDocuments: typeCounts['visa'] || 0,
    insuranceDocuments: typeCounts['travel_insurance'] || 0,
    flightTickets: typeCounts['flight_ticket'] || 0,
    hotelVouchers: typeCounts['hotel_voucher'] || 0,
    legalHoldCount: legalHold.count || 0,
  }
}

// ── Chart Data ────────────────────────────────────────────────────────────────

export async function getDocumentChartData(): Promise<DocumentChartData> {
  const supabase = await createClient()

  const { data: allDocs } = await supabase
    .from('documents')
    .select('document_type, approval_status, expiry_date, country, created_at')
    .neq('approval_status', 'archived')

  const docs = allDocs || []

  // By category
  const categoryMap: Record<string, number> = {}
  docs.forEach(d => { categoryMap[d.document_type] = (categoryMap[d.document_type] || 0) + 1 })
  const categoryColors: Record<string, string> = {
    passport: '#6366f1', visa: '#8b5cf6', flight_ticket: '#06b6d4',
    hotel_voucher: '#10b981', travel_insurance: '#f59e0b', national_id: '#ef4444',
    bank_statement: '#3b82f6', other: '#94a3b8',
  }
  const byCategory = Object.entries(categoryMap).map(([name, value]) => ({
    name, value, color: categoryColors[name] || '#94a3b8'
  }))

  // By status
  const statusMap: Record<string, number> = {}
  docs.forEach(d => { statusMap[d.approval_status] = (statusMap[d.approval_status] || 0) + 1 })
  const statusColors: Record<string, string> = {
    draft: '#94a3b8', pending_review: '#f59e0b', approved: '#10b981',
    rejected: '#ef4444', archived: '#6b7280',
  }
  const byStatus = Object.entries(statusMap).map(([name, value]) => ({
    name, value, color: statusColors[name] || '#94a3b8'
  }))

  // Expiration timeline (next 12 months)
  const now = new Date()
  const expirationTimeline = Array.from({ length: 6 }).map((_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthStr = month.toISOString().slice(0, 7)
    const expiring = docs.filter(d => d.expiry_date?.startsWith(monthStr)).length
    const expired = docs.filter(d => {
      if (!d.expiry_date) return false
      return new Date(d.expiry_date) < now && d.expiry_date?.startsWith(monthStr)
    }).length
    return {
      month: month.toLocaleString('en', { month: 'short', year: '2-digit' }),
      expiring,
      expired,
    }
  })

  // Monthly uploads (last 6 months)
  const monthlyUploads = Array.from({ length: 6 }).map((_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthStr = month.toISOString().slice(0, 7)
    const uploads = docs.filter(d => d.created_at?.startsWith(monthStr)).length
    return {
      month: month.toLocaleString('en', { month: 'short', year: '2-digit' }),
      uploads,
    }
  })

  // By country
  const countryMap: Record<string, number> = {}
  docs.forEach(d => {
    if (d.country) countryMap[d.country] = (countryMap[d.country] || 0) + 1
  })
  const byCountry = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([country, count]) => ({ country, count }))

  return {
    byCategory,
    expirationTimeline,
    monthlyUploads,
    byStatus,
    byCountry,
    approvalFlow: byStatus, // reuse
  }
}

// ── Expiration Warnings ───────────────────────────────────────────────────────

export async function getExpirationWarnings(dayThreshold = 180) {
  const supabase = await createClient()

  const thresholdDate = new Date(Date.now() + dayThreshold * 86400000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('documents')
    .select(`
      id, document_name, document_type, expiry_date,
      bookings!documents_booking_id_fkey(booking_reference),
      booking_travelers!documents_traveler_id_fkey(first_name, last_name)
    `)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', thresholdDate)
    .neq('approval_status', 'archived')
    .order('expiry_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch expiration warnings: ${error.message}`)

  const today = new Date()
  return (data || []).map(doc => {
    const expiry = new Date(doc.expiry_date!)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
    const traveler = (doc as any).booking_travelers
    return {
      documentId: doc.id,
      documentName: doc.document_name,
      documentType: doc.document_type as DocumentType,
      expiryDate: doc.expiry_date!,
      daysUntilExpiry,
      severity: (
        daysUntilExpiry < 0 ? 'expired' :
        daysUntilExpiry <= 30 ? 'critical' :
        daysUntilExpiry <= 90 ? 'warning' :
        'caution'
      ) as any,
      bookingReference: (doc as any).bookings?.booking_reference,
      travelerName: traveler ? `${traveler.first_name} ${traveler.last_name}` : undefined,
    }
  })
}
